import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { getSupabaseAdminClient } from "@/lib/supabase/pickup_qr_verify";

/** Rename a category — dishes already assigned to it are re-pointed to
 * the new name in the same request, so no dish is silently orphaned. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const vendorCtx = await getAuthenticatedVendorContext();
  if (!vendorCtx) {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as { name?: unknown };
  const newName = typeof body?.name === "string" ? body.name.trim() : "";
  if (!newName) {
    return NextResponse.json({ ok: false, error: "Category name is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("vendor_categories")
    .select("id, name")
    .eq("id", id)
    .eq("canteen_id", vendorCtx.canteenId)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Category not found." }, { status: 404 });
  }

  const { error: updateErr } = await supabase
    .from("vendor_categories")
    .update({ name: newName })
    .eq("id", id)
    .eq("canteen_id", vendorCtx.canteenId);

  if (updateErr) {
    const message = updateErr.code === "23505" ? "This category already exists." : "Unable to rename category.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  // Cascade the rename onto every dish currently using the old name.
  await supabase
    .from("menu_items")
    .update({ category: newName })
    .eq("canteen_id", vendorCtx.canteenId)
    .eq("category", existing.name);

  return NextResponse.json({ ok: true, category: { id, name: newName } });
}

/** Deletes a category. If dishes are still assigned to it, the caller
 * must pass `moveTo` (an existing category name) — dishes are moved
 * there first, so a category can never be deleted out from under a
 * dish without an explicit destination. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const vendorCtx = await getAuthenticatedVendorContext();
  if (!vendorCtx) {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const moveTo = searchParams.get("moveTo");

  const supabase = getSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("vendor_categories")
    .select("id, name")
    .eq("id", id)
    .eq("canteen_id", vendorCtx.canteenId)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Category not found." }, { status: 404 });
  }

  const { count } = await supabase
    .from("menu_items")
    .select("id", { count: "exact", head: true })
    .eq("canteen_id", vendorCtx.canteenId)
    .eq("category", existing.name);

  const dishCount = count ?? 0;

  if (dishCount > 0) {
    if (!moveTo) {
      return NextResponse.json(
        { ok: false, error: "DISHES_ASSIGNED", dishCount },
        { status: 409 },
      );
    }
    if (moveTo === existing.name) {
      return NextResponse.json(
        { ok: false, error: "Choose a different category to move dishes to." },
        { status: 400 },
      );
    }
    await supabase
      .from("menu_items")
      .update({ category: moveTo })
      .eq("canteen_id", vendorCtx.canteenId)
      .eq("category", existing.name);
  }

  await supabase.from("vendor_categories").delete().eq("id", id).eq("canteen_id", vendorCtx.canteenId);

  return NextResponse.json({ ok: true });
}
