import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { recordSuperAdminAction } from "@/lib/supabase/superadmin_audit";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json({ ok: false, error: "Access denied. Vendor authentication required." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      clientOrderId,
      canteenId,
      customerName,
      customerPhone,
      studentIdentifier,
      items,
      createdAt,
    } = body;

    if (!clientOrderId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload: clientOrderId and items are required." },
        { status: 400 }
      );
    }

    const targetCanteenId = canteenId || vendorCtx.canteenId;
    if (targetCanteenId !== vendorCtx.canteenId) {
      return NextResponse.json(
        { ok: false, error: "Security Policy: Vendor cannot create orders for another canteen." },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // 1. IDEMPOTENCY CHECK — Check if clientOrderId already exists in orders table
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, order_number, status, total_amount, created_at, client_order_id")
      .eq("client_order_id", clientOrderId)
      .maybeSingle();

    if (existingOrder) {
      return NextResponse.json({
        ok: true,
        isDuplicate: true,
        message: "Order already synchronized (idempotency key hit).",
        order: {
          id: existingOrder.id,
          orderNumber: existingOrder.order_number,
          status: existingOrder.status,
          totalAmount: Number(existingOrder.total_amount),
          createdAt: existingOrder.created_at,
          clientOrderId: existingOrder.client_order_id,
        },
      });
    }

    // 2. AUTHORITATIVE MENU PRICE VALIDATION — Query menu_items from DB
    const menuItemIds = items.map((i: any) => i.menuItemId).filter(Boolean);
    const { data: dbMenuItems, error: menuErr } = await supabase
      .from("menu_items")
      .select("id, canteen_id, name, price, availability")
      .in("id", menuItemIds);

    if (menuErr || !dbMenuItems || dbMenuItems.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Selected menu items could not be validated in canteen menu." },
        { status: 400 }
      );
    }

    const dbMenuMap = new Map(dbMenuItems.map((item) => [item.id, item]));

    let calculatedTotal = 0;
    const validatedOrderItems: Array<{
      menu_item_id: string;
      quantity: number;
      price_at_order: number;
    }> = [];

    for (const item of items) {
      const dbItem = dbMenuMap.get(item.menuItemId);
      if (!dbItem) {
        return NextResponse.json(
          { ok: false, error: `Product item ID ${item.menuItemId} is not in canteen menu.` },
          { status: 400 }
        );
      }

      if (dbItem.canteen_id !== vendorCtx.canteenId) {
        return NextResponse.json(
          { ok: false, error: `Security Policy: Product ${dbItem.name} belongs to another vendor.` },
          { status: 403 }
        );
      }

      const qty = Math.max(1, Number(item.quantity || 1));
      const authoritativePrice = Number(dbItem.price); // DB price, client price ignored
      calculatedTotal += authoritativePrice * qty;

      validatedOrderItems.push({
        menu_item_id: dbItem.id,
        quantity: qty,
        price_at_order: authoritativePrice,
      });
    }

    // 3. STUDENT IDENTITY LOOKUP FOR REWARDS
    let studentId: string | null = null;
    if (studentIdentifier && studentIdentifier.trim()) {
      const cleanIdent = studentIdentifier.trim();
      const { data: foundStudent } = await supabase
        .from("users")
        .select("id, phone, role")
        .or(`phone.eq.${cleanIdent},id.eq.${cleanIdent}`)
        .eq("role", "student")
        .maybeSingle();

      if (foundStudent) {
        studentId = foundStudent.id;
      }
    }

    // 4. CREATE ORDER REFERENCE
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `GRABIT-M-${randomSuffix}`;
    const orderTimestamp = createdAt || new Date().toISOString();

    const orderRow: any = {
      order_number: orderNumber,
      canteen_id: vendorCtx.canteenId,
      status: "preparing", // Immediate active fulfillment status, bypassing accept/reject
      order_type: "MANUAL_CASH_ORDER",
      payment_method: "cash",
      total_amount: calculatedTotal,
      client_order_id: clientOrderId,
      customer_name: customerName?.trim() || "Walk-in Customer",
      customer_phone: customerPhone?.trim() || null,
      student_identifier: studentIdentifier?.trim() || null,
      is_manual: true,
      created_at: orderTimestamp,
    };

    if (studentId) {
      orderRow.student_id = studentId;
    }

    const { data: createdOrder, error: insertErr } = await supabase
      .from("orders")
      .insert(orderRow)
      .select("id, order_number, status, total_amount, created_at")
      .single();

    if (insertErr || !createdOrder) {
      console.error("Manual cash order DB insert error:", insertErr);
      return NextResponse.json(
        { ok: false, error: insertErr?.message || "Failed to persist manual order." },
        { status: 500 }
      );
    }

    // 5. INSERT ORDER ITEMS
    const orderItemsRows = validatedOrderItems.map((item) => ({
      order_id: createdOrder.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price_at_order: item.price_at_order,
    }));

    await supabase.from("order_items").insert(orderItemsRows);

    // 5b. Deduct stock for each ordered item — one authoritative deduction at
    // creation, matching the regular order flow. Never re-deducted on sync
    // (client_order_id idempotency prevents this insert running twice) or
    // on Mark Ready/status transitions.
    for (const item of validatedOrderItems) {
      try {
        await supabase.rpc("adjust_inventory_stock", {
          p_menu_item_id: item.menu_item_id,
          p_quantity_delta: -item.quantity,
          p_adjustment_type: "order_deduction",
          p_reason: `Manual cash order ${orderNumber}`,
          p_user_id: vendorCtx.userId,
        });
      } catch (invErr) {
        console.warn("Non-critical inventory deduction warning:", invErr);
      }
    }

    // 6. CREATE CASH PAYMENT RECORD
    await supabase.from("payments").insert({
      order_id: createdOrder.id,
      method: "upi", // standard table enum fallback or cash
      amount: calculatedTotal,
      vendor_settlement: calculatedTotal * 0.9, // 90% vendor, 10% platform
      status: "success",
    });

    // 7. RECORD AUDIT LOG
    await recordSuperAdminAction({
      adminId: vendorCtx.userId,
      action: "manual_cash_order_created",
      module: "Orders",
      targetType: "ORDER",
      targetId: createdOrder.id,
      newState: {
        orderNumber,
        orderType: "MANUAL_CASH_ORDER",
        totalAmount: calculatedTotal,
        clientOrderId,
        canteenId: vendorCtx.canteenId,
      },
      reason: `Vendor manually created cash order ${orderNumber} for ${customerName || "Walk-in Customer"}`,
    });

    return NextResponse.json({
      ok: true,
      message: `Manual Cash Order ${orderNumber} created successfully.`,
      order: {
        id: createdOrder.id,
        orderNumber: createdOrder.order_number,
        status: createdOrder.status,
        totalAmount: Number(createdOrder.total_amount),
        createdAt: createdOrder.created_at,
        clientOrderId,
        orderType: "MANUAL_CASH_ORDER",
      },
    });
  } catch (err: any) {
    console.error("Manual cash order POST error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error creating manual order." },
      { status: 500 }
    );
  }
}
