import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface PromoCodePatchPayload {
  code?: string;
  description?: string;
  discountType?: "PERCENTAGE" | "FLAT";
  discountValue?: number;
  maxDiscount?: number | null;
  minOrderValue?: number;
  usageLimit?: number | null;
  perUserLimit?: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  campusId?: string | null;
  canteenId?: string | null;
  isActive?: boolean;
  isPublished?: boolean;
}

/** Full edit, or a single toggle (isActive/isPublished) — keyed off
 * whichever fields the request includes, matching the vendor-management
 * PATCH convention elsewhere in this codebase. Admin-only. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthenticatedSuperAdminContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied. Super Admin authorization required." }, { status: 403 });
  }
  const { id } = await params;
  const body = (await request.json()) as PromoCodePatchPayload;

  if (body.discountType === "PERCENTAGE" && body.discountValue !== undefined && body.discountValue > 100) {
    return NextResponse.json({ ok: false, error: "Percentage discount cannot exceed 100." }, { status: 400 });
  }
  if (body.startsAt && body.expiresAt && new Date(body.startsAt) >= new Date(body.expiresAt)) {
    return NextResponse.json({ ok: false, error: "Expiry must be after the start date." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.code !== undefined) updates.code = body.code.trim().toUpperCase();
  if (body.description !== undefined) updates.description = body.description.trim() || null;
  if (body.discountType !== undefined) updates.discount_type = body.discountType;
  if (body.discountValue !== undefined) updates.discount_value = body.discountValue;
  if (body.maxDiscount !== undefined) updates.max_discount = body.maxDiscount;
  if (body.minOrderValue !== undefined) updates.min_order_value = body.minOrderValue;
  if (body.usageLimit !== undefined) updates.usage_limit = body.usageLimit;
  if (body.perUserLimit !== undefined) updates.per_user_limit = body.perUserLimit;
  if (body.startsAt !== undefined) updates.starts_at = body.startsAt || null;
  if (body.expiresAt !== undefined) updates.expires_at = body.expiresAt || null;
  if (body.campusId !== undefined) updates.campus_id = body.campusId || null;
  if (body.canteenId !== undefined) updates.canteen_id = body.canteenId || null;
  if (body.isActive !== undefined) updates.is_active = body.isActive;
  if (body.isPublished !== undefined) updates.is_published = body.isPublished;

  const { error } = await admin.from("promo_codes").update(updates).eq("id", id);
  if (error) {
    const message = error.message?.includes("duplicate key") ? "A promo code with this code already exists." : "Failed to update promo code.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

/** Deletes a promo code. Blocked if it has any redemptions on real
 * orders — deleting it would orphan financial/audit history; the
 * admin should deactivate/unpublish it instead. Admin-only. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthenticatedSuperAdminContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied. Super Admin authorization required." }, { status: 403 });
  }
  const { id } = await params;
  const admin = getSupabaseAdminClient();

  const { count } = await admin
    .from("promo_code_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("promo_code_id", id);

  if (count && count > 0) {
    return NextResponse.json(
      { ok: false, error: "This promo code has already been used and can't be deleted — deactivate or unpublish it instead." },
      { status: 400 },
    );
  }

  const { error } = await admin.from("promo_codes").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: "Failed to delete promo code." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
