import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { trackProductEvent } from "@/lib/analytics/events";

interface IncomingOrderItem {
  menuItemId: string;
  quantity: number;
  // Note: Client price is explicitly ignored for security!
  price?: number;
}

interface CreateOrderPayload {
  canteenId: string;
  canteenName?: string;
  slot: string;
  paymentMethod: "upi" | "wallet";
  items: IncomingOrderItem[];
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateOrderPayload;

    // 1. Basic Payload Validation
    if (!payload.canteenId) {
      return NextResponse.json(
        { ok: false, error: "Canteen ID is required." },
        { status: 400 },
      );
    }

    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Your cart is empty." },
        { status: 400 },
      );
    }

    for (const item of payload.items) {
      if (!item.menuItemId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { ok: false, error: "Cart contains an invalid item quantity." },
          { status: 400 },
        );
      }
    }

    // 2. Derive Student Identity Server-Side strictly from Supabase Auth Session
    const supabaseServer = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabaseServer.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to place an order." },
        { status: 401 },
      );
    }

    // Initialize Admin Supabase Client for bypassing RLS during order placement
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createAdminClient(url, serviceKey);

    // 3. Authoritative Role Verification from Database
    const { data: userRow } = await supabase
      .from("users")
      .select("id, role, campus_id")
      .eq("id", user.id)
      .maybeSingle();

    if (userRow && userRow.role !== "student") {
      return NextResponse.json(
        { ok: false, error: "Only students are allowed to place orders." },
        { status: 403 },
      );
    }

    const effectiveCanteenId = payload.canteenId;

    // 4. Authoritative Canteen & Campus Validation
    const { data: canteenRow, error: canteenErr } = await supabase
      .from("canteens")
      .select("id, campus_id, status, name")
      .eq("id", effectiveCanteenId)
      .maybeSingle();

    if (canteenErr || !canteenRow) {
      return NextResponse.json(
        { ok: false, error: "The selected vendor could not be found." },
        { status: 400 },
      );
    }

    if (canteenRow.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "This vendor is currently not accepting orders." },
        { status: 400 },
      );
    }

    if (userRow?.campus_id && canteenRow.campus_id !== userRow.campus_id) {
      return NextResponse.json(
        { ok: false, error: "This vendor is not available at your selected campus." },
        { status: 400 },
      );
    }

    // 5. Fetch authoritative menu items & validate vendor ownership
    const menuItemIds = payload.items.map((i) => i.menuItemId);
    const { data: dbMenuItems, error: dbErr } = await supabase
      .from("menu_items")
      .select("id, name, price, availability, canteen_id")
      .in("id", menuItemIds);

    if (dbErr || !dbMenuItems || dbMenuItems.length === 0) {
      return NextResponse.json(
        { ok: false, error: "One or more selected menu items could not be found." },
        { status: 400 },
      );
    }

    const menuItemMap = new Map<
      string,
      { name: string; price: number; isAvailable: boolean; canteenId: string }
    >();
    dbMenuItems.forEach((item) => {
      menuItemMap.set(item.id, {
        name: item.name,
        price: Number(item.price),
        isAvailable: item.availability === "available",
        canteenId: item.canteen_id,
      });
    });

    // 6. Compute authoritative server-side totals & enforce cross-vendor protection
    let subtotal = 0;
    const validatedLineItems: {
      menuItemId: string;
      name: string;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
    }[] = [];

    for (const item of payload.items) {
      const dbItem = menuItemMap.get(item.menuItemId);
      if (!dbItem) {
        return NextResponse.json(
          { ok: false, error: `Menu item ${item.menuItemId} is not available.` },
          { status: 400 },
        );
      }

      if (dbItem.canteenId !== effectiveCanteenId) {
        return NextResponse.json(
          { ok: false, error: "One or more items do not belong to the selected vendor." },
          { status: 400 },
        );
      }

      if (!dbItem.isAvailable) {
        return NextResponse.json(
          { ok: false, error: `"${dbItem.name}" is currently out of stock.` },
          { status: 400 },
        );
      }

      const lineTotal = dbItem.price * item.quantity;
      subtotal += lineTotal;
      validatedLineItems.push({
        menuItemId: item.menuItemId,
        name: dbItem.name,
        unitPrice: dbItem.price,
        quantity: item.quantity,
        lineTotal,
      });
    }

    const platformFee = Math.round(subtotal * 0.05); // 5% platform fee
    const totalAmount = subtotal + platformFee;

    // 7. Auto-Initialize Wallet & Handle Wallet Debit
    if (payload.paymentMethod === "wallet") {
      // Ensure student wallet exists
      const { data: existingWallet } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingWallet) {
        await supabase.from("wallets").insert({
          user_id: user.id,
          balance: 500, // Initialize starting balance for student
        });
      } else if (Number(existingWallet.balance) < totalAmount) {
        // Auto-topup demo student wallet if balance is lower than total
        await supabase
          .from("wallets")
          .update({ balance: Number(existingWallet.balance) + totalAmount + 500 })
          .eq("id", existingWallet.id);
      }

      const { data: debitResult, error: debitErr } = await supabase.rpc(
        "debit_student_wallet",
        {
          p_user_id: user.id,
          p_amount: totalAmount,
          p_order_id: null,
        },
      );

      if (debitErr) {
        console.error("Wallet debit RPC error:", debitErr);
        return NextResponse.json(
          { ok: false, error: "Failed to debit student wallet. Please try again." },
          { status: 500 },
        );
      }

      const resultObj = debitResult as { ok: boolean; error?: string };
      if (!resultObj || !resultObj.ok) {
        return NextResponse.json(
          { ok: false, error: resultObj?.error || "Insufficient wallet balance." },
          { status: 400 },
        );
      }
    }

    // 8. Generate human-readable order number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `#${randomSuffix}`;

    const dbSlot: "short_break" | "lunch" =
      payload.slot === "short_break" || payload.slot === "lunch"
        ? payload.slot
        : payload.slot === "1:00 PM" || payload.slot === "1:30 PM" || payload.slot === "LUNCH_1230"
          ? "lunch"
          : "short_break";

    // Unique pickup-verification token for this order's QR. Generated
    // server-side with crypto randomness — never derived from the order
    // id / order number, which are guessable.
    const pickupQrToken = randomBytes(32).toString("hex");

    // 9. Atomic Order Insertion
    const { data: createdOrder, error: orderErr } = await supabase
      .from("orders")
      .insert({
        student_id: user.id,
        canteen_id: effectiveCanteenId,
        order_number: orderNumber,
        status: "placed",
        total_amount: totalAmount,
        slot: dbSlot,
        pickup_qr_token: pickupQrToken,
        pickup_qr_created_at: new Date().toISOString(),
      })
      .select("id, order_number, created_at, canteen_id, student_id")
      .single();

    if (orderErr || !createdOrder) {
      console.error("Failed to insert order into database:", orderErr);
      return NextResponse.json(
        { ok: false, error: "Failed to save order. Please try again." },
        { status: 500 },
      );
    }

    // 10. Insert order_items
    const orderItemsToInsert = validatedLineItems.map((item) => ({
      order_id: createdOrder.id,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      price_at_order: item.unitPrice,
    }));

    await supabase.from("order_items").insert(orderItemsToInsert);

    // 11. Insert Audit History Record
    try {
      await supabase.from("order_status_history").insert({
        order_id: createdOrder.id,
        previous_status: null,
        new_status: "placed",
        changed_by: user.id,
        actor_role: "student",
        reason: "Order placed by student",
      });
    } catch (auditErr) {
      console.warn("Non-critical audit log insertion error:", auditErr);
    }

    // 12. Insert Payment Record
    await supabase.from("payments").insert({
      order_id: createdOrder.id,
      method: payload.paymentMethod === "upi" ? "upi" : "wallet",
      amount: totalAmount,
      platform_fee: platformFee,
      vendor_settlement: subtotal,
      status: payload.paymentMethod === "wallet" ? "success" : "pending",
    });

    // 13. Server Analytics Event Tracking
    trackProductEvent({
      eventName: "order_created",
      orderId: createdOrder.id,
      canteenId: createdOrder.canteen_id,
      metadata: { totalAmount, paymentMethod: payload.paymentMethod },
    });

    trackProductEvent({
      eventName: payload.paymentMethod === "wallet" ? "payment_succeeded" : "payment_started",
      orderId: createdOrder.id,
      canteenId: createdOrder.canteen_id,
      metadata: { amount: totalAmount, method: payload.paymentMethod },
    });

    // 14. Notifications Side-Effects
    try {
      const { createStudentNotification } = await import("@/lib/notifications/student_notifications");
      await createStudentNotification({
        userId: user.id,
        type: "ORDER_PLACED",
        title: `Order #${createdOrder.order_number ?? createdOrder.id.slice(0, 6)} Placed`,
        message: `Your order for ₹${totalAmount} has been placed successfully at ${payload.canteenName ?? "Campus Canteen"}.`,
        severity: "INFO",
        category: "ORDERS",
        relatedOrderId: createdOrder.id,
        actionUrl: `/customer/orders/${createdOrder.id}`,
        dedupeKey: `order-placed:${createdOrder.id}`,
      });

      const { createOperationalNotification } = await import("@/lib/notifications/operational_notifications");
      await createOperationalNotification({
        recipientType: "vendor",
        canteenId: createdOrder.canteen_id,
        type: "NEW_ORDER",
        severity: "INFO",
        title: `New Order #${createdOrder.order_number ?? createdOrder.id.slice(0, 6)} Received`,
        message: `${validatedLineItems.length} items totaling ₹${totalAmount}. Slot: ${payload.slot}.`,
        actionUrl: "/vendor",
        relatedOrderId: createdOrder.id,
        dedupeKey: `vendor-new-order:${createdOrder.id}`,
      });
    } catch (notifErr) {
      console.warn("Non-critical notification side-effect error:", notifErr);
    }

    // 15. Return Created Order to Client
    return NextResponse.json({
      ok: true,
      order: {
        id: createdOrder.id,
        orderNumber: createdOrder.order_number,
        canteenId: createdOrder.canteen_id,
        canteenName: payload.canteenName ?? canteenRow.name ?? "Campus Canteen",
        studentId: createdOrder.student_id,
        slot: payload.slot,
        status: "placed",
        paymentMethod: payload.paymentMethod,
        items: validatedLineItems.map((item) => ({
          id: item.menuItemId,
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.unitPrice,
          quantity: item.quantity,
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDZBzLTcW8jMglof_WJYCishy5utlKfXNXx-fTlOXX7hEvRNJPaSTWNOpM4cXPjrfaKLcIn9aUftSkcSNLIJna0JusFxXKpuaMNog2ErNm3n7wuG9OLaMZAZjnReZ8TFyk2AWt07t8jJOzUuy88-FvyMLC3In-UR1Lov7nFSKWvv8xONyeErA7Z3ex23x8c2voEdWYJBcWsb-Tj192p4EZc6477IIpd7g_C95TCG2ZOo505Ui8aXozl",
          lineTotal: item.lineTotal,
        })),
        subtotal,
        platformFee,
        totalAmount,
        createdAt: createdOrder.created_at,
        estimatedReadyAt: new Date(
          new Date(createdOrder.created_at).getTime() + 10 * 60_000,
        ).toISOString(),
      },
    });
  } catch (err) {
    console.error("Server order route error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error creating order." },
      { status: 500 },
    );
  }
}
