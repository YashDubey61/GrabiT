import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface CreateMenuItemPayload {
  name: string;
  price: number;
  availability?: "available" | "unavailable";
  category?: string;
  description?: string;
  imageUrl?: string;
  image_url?: string;
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
        { ok: false, error: "Failed to fetch menu items." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, items });
  } catch (err) {
    console.error("Vendor menu GET error:", err);
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

    const payload = (await request.json()) as CreateMenuItemPayload;

    if (!payload.name || !payload.name.trim()) {
      return NextResponse.json(
        { ok: false, error: "Dish name is required." },
        { status: 400 },
      );
    }

    const price = Number(payload.price);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { ok: false, error: "Price must be greater than ₹0." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    const imageUrl = payload.imageUrl?.trim() || payload.image_url?.trim() || null;
    const category = payload.category?.trim() || null;
    const description = payload.description?.trim() || null;

    const { data: newItem, error: insertErr } = await supabase
      .from("menu_items")
      .insert({
        canteen_id: vendorCtx.canteenId,
        name: payload.name.trim(),
        price: price,
        availability: payload.availability ?? "available",
        is_sponsored: false,
        category: category,
        description: description,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (insertErr || !newItem) {
      console.error("Menu item creation database error:", insertErr);
      return NextResponse.json(
        { ok: false, error: "Failed to add menu item." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, item: newItem });
  } catch (err) {
    console.error("Vendor menu POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error adding menu item." },
      { status: 500 },
    );
  }
}
