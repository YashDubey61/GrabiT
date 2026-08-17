import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { getSupabaseAdminClient } from "@/lib/supabase/pickup_qr_verify";

export async function GET() {
  const vendorCtx = await getAuthenticatedVendorContext();
  if (!vendorCtx) {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("vendor_categories")
    .select("id, name")
    .eq("canteen_id", vendorCtx.canteenId)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: "Unable to load categories." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, categories: data ?? [] });
}

export async function POST(request: Request) {
  const vendorCtx = await getAuthenticatedVendorContext();
  if (!vendorCtx) {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const body = (await request.json()) as { name?: unknown };
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ ok: false, error: "Category name is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("vendor_categories")
    .insert({ canteen_id: vendorCtx.canteenId, name })
    .select("id, name")
    .single();

  if (error) {
    const message = error.code === "23505" ? "This category already exists." : "Unable to add category.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, category: data });
}
