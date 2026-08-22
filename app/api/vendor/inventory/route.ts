import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface AdjustStockPayload {
  menuItemId: string;
  quantityDelta?: number;
  exactQuantity?: number;
  adjustmentType?: string;
  reason?: string;
}

export async function GET() {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Please sign in with a vendor account." },
        { status: 401 },
      );
    }

    const supabase = getSupabaseAdminClient();
    const { data: items, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("canteen_id", vendorCtx.canteenId)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Failed to fetch inventory items." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, items });
  } catch (err) {
    console.error("Vendor inventory GET error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Please sign in with a vendor account." },
        { status: 401 },
      );
    }

    const payload = (await request.json()) as AdjustStockPayload;

    if (!payload.menuItemId) {
      return NextResponse.json(
        { ok: false, error: "Menu item ID is required." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    // Cross-tenant IDOR Security Check
    const { data: dbItem } = await supabase
      .from("menu_items")
      .select("id, canteen_id, stock_quantity, availability, name")
      .eq("id", payload.menuItemId)
      .limit(1);

    if (!dbItem || dbItem.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Menu item not found." },
        { status: 404 },
      );
    }

    const targetItem = dbItem[0];
    if (targetItem.canteen_id !== vendorCtx.canteenId) {
      return NextResponse.json(
        { ok: false, error: "Forbidden. You do not have permission to modify this menu item's inventory." },
        { status: 403 },
      );
    }

    const currentStock = Number(targetItem.stock_quantity ?? 50);
    let newStock = currentStock;

    if (payload.exactQuantity !== undefined) {
      newStock = Math.max(0, Number(payload.exactQuantity) || 0);
    } else if (payload.quantityDelta !== undefined) {
      newStock = Math.max(0, currentStock + Number(payload.quantityDelta));
    }

    const qtyChanged = newStock - currentStock;
    const newAvailability = newStock <= 0 ? "unavailable" : "available";

    // Atomic DB Update
    const { error: updateErr } = await supabase
      .from("menu_items")
      .update({
        stock_quantity: newStock,
        availability: newAvailability,
      })
      .eq("id", targetItem.id);

    if (updateErr) {
      console.error("Inventory update database error:", updateErr);
      return NextResponse.json(
        { ok: false, error: "Failed to update stock quantity." },
        { status: 500 },
      );
    }

    // Record audit log entry in inventory_logs
    try {
      await supabase.from("inventory_logs").insert({
        menu_item_id: targetItem.id,
        canteen_id: vendorCtx.canteenId,
        previous_quantity: currentStock,
        new_quantity: newStock,
        quantity_changed: qtyChanged,
        adjustment_type: payload.adjustmentType || "manual_correction",
        reason: payload.reason?.trim() || null,
        created_by: vendorCtx.userId,
      });
    } catch (logErr) {
      console.warn("Non-critical inventory log insert warning:", logErr);
    }

    return NextResponse.json({
      ok: true,
      menuItemId: targetItem.id,
      previousQuantity: currentStock,
      newQuantity: newStock,
      availability: newAvailability,
    });
  } catch (err) {
    console.error("Vendor inventory POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error adjusting inventory." },
      { status: 500 },
    );
  }
}
