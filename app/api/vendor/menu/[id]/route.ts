import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface UpdateMenuItemPayload {
  name?: string;
  price?: number;
  availability?: "available" | "unavailable";
  category?: string;
  description?: string;
  imageUrl?: string;
  image_url?: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Please sign in with a vendor account." },
        { status: 401 },
      );
    }

    const { id: itemId } = await params;
    const payload = (await request.json()) as UpdateMenuItemPayload;

    const updates: Record<string, unknown> = {};

    if (payload.name !== undefined) {
      if (!payload.name.trim()) {
        return NextResponse.json(
          { ok: false, error: "Dish name cannot be empty." },
          { status: 400 },
        );
      }
      updates.name = payload.name.trim();
    }

    if (payload.price !== undefined) {
      const price = Number(payload.price);
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json(
          { ok: false, error: "Price must be greater than ₹0." },
          { status: 400 },
        );
      }
      updates.price = price;
    }

    if (payload.availability !== undefined) {
      if (payload.availability !== "available" && payload.availability !== "unavailable") {
        return NextResponse.json(
          { ok: false, error: "Invalid availability status." },
          { status: 400 },
        );
      }
      updates.availability = payload.availability;
    }

    if (payload.category !== undefined) {
      updates.category = payload.category.trim() || null;
    }

    if (payload.description !== undefined) {
      updates.description = payload.description.trim() || null;
    }

    const imageUrl = payload.imageUrl ?? payload.image_url;
    if (imageUrl !== undefined) {
      updates.image_url = imageUrl.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { ok: false, error: "No update fields provided." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    // Cross-tenant IDOR Security Check: Verify dish belongs strictly to authorized vendor's canteen
    const { data: dbItem } = await supabase
      .from("menu_items")
      .select("id, canteen_id")
      .eq("id", itemId)
      .limit(1);

    if (!dbItem || dbItem.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Menu item not found." },
        { status: 404 },
      );
    }

    if (dbItem[0].canteen_id !== vendorCtx.canteenId) {
      return NextResponse.json(
        { ok: false, error: "Forbidden. You do not have permission to modify this menu item." },
        { status: 403 },
      );
    }

    const { data: updatedItem, error: updateErr } = await supabase
      .from("menu_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();

    if (updateErr || !updatedItem) {
      console.error("Menu item update database error:", updateErr);
      return NextResponse.json(
        { ok: false, error: "Failed to update menu item." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, item: updatedItem });
  } catch (err) {
    console.error("Vendor menu PATCH error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error updating menu item." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Please sign in with a vendor account." },
        { status: 401 },
      );
    }

    const { id: itemId } = await params;
    const supabase = getSupabaseAdminClient();

    // Verify item ownership
    const { data: dbItem } = await supabase
      .from("menu_items")
      .select("id, canteen_id, name")
      .eq("id", itemId)
      .limit(1);

    if (!dbItem || dbItem.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Menu item not found." },
        { status: 404 },
      );
    }

    if (dbItem[0].canteen_id !== vendorCtx.canteenId) {
      return NextResponse.json(
        { ok: false, error: "Forbidden. You do not have permission to delete this menu item." },
        { status: 403 },
      );
    }

    const { error: deleteErr } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", itemId);

    if (deleteErr) {
      console.error("Menu item delete database error:", deleteErr);
      return NextResponse.json(
        { ok: false, error: "Failed to delete menu item." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, deletedId: itemId });
  } catch (err) {
    console.error("Vendor menu DELETE error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error deleting menu item." },
      { status: 500 },
    );
  }
}
