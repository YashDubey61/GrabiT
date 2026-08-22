import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/** Lists every promo code with its live usage count, for Super Admin
 * management. Admin-only. */
export async function GET() {
  const ctx = await getAuthenticatedSuperAdminContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied. Super Admin authorization required." }, { status: 403 });
  }

  const admin = getSupabaseAdminClient();
  const { data: promos, error } = await admin
    .from("promo_codes")
    .select("*, campuses(name), canteens(name)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: "Failed to load promo codes." }, { status: 500 });
  }

  const { data: redemptions } = await admin.from("promo_code_redemptions").select("promo_code_id");
  const usageCounts = new Map<string, number>();
  for (const r of redemptions ?? []) {
    usageCounts.set(r.promo_code_id, (usageCounts.get(r.promo_code_id) ?? 0) + 1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (promos as any[]).map((p) => ({
    ...p,
    campusName: p.campuses?.name ?? null,
    canteenName: p.canteens?.name ?? null,
    usageCount: usageCounts.get(p.id) ?? 0,
  }));

  return NextResponse.json({ ok: true, promoCodes: rows });
}

interface PromoCodePayload {
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

function validatePayload(body: PromoCodePayload): string | null {
  if (!body.code || !body.code.trim()) return "Promo code is required.";
  if (body.discountType !== "PERCENTAGE" && body.discountType !== "FLAT") return "Discount type must be Percentage or Flat.";
  if (!Number.isFinite(body.discountValue) || (body.discountValue ?? 0) <= 0) return "Discount value must be greater than 0.";
  if (body.discountType === "PERCENTAGE" && (body.discountValue ?? 0) > 100) return "Percentage discount cannot exceed 100.";
  if (body.minOrderValue !== undefined && body.minOrderValue < 0) return "Minimum order value cannot be negative.";
  if (body.usageLimit !== undefined && body.usageLimit !== null && body.usageLimit <= 0) return "Usage limit must be greater than 0.";
  if (body.perUserLimit !== undefined && body.perUserLimit !== null && body.perUserLimit <= 0) return "Per-user limit must be greater than 0.";
  if (body.startsAt && body.expiresAt && new Date(body.startsAt) >= new Date(body.expiresAt)) return "Expiry must be after the start date.";
  return null;
}

/** Creates a new promo code. Admin-only. */
export async function POST(request: Request) {
  const ctx = await getAuthenticatedSuperAdminContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied. Super Admin authorization required." }, { status: 403 });
  }

  const body = (await request.json()) as PromoCodePayload;
  const validationError = validatePayload(body);
  if (validationError) {
    return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("promo_codes")
    .insert({
      code: body.code!.trim().toUpperCase(),
      description: body.description?.trim() || null,
      discount_type: body.discountType,
      discount_value: body.discountValue,
      max_discount: body.maxDiscount ?? null,
      min_order_value: body.minOrderValue ?? 0,
      usage_limit: body.usageLimit ?? null,
      per_user_limit: body.perUserLimit ?? 1,
      starts_at: body.startsAt || null,
      expires_at: body.expiresAt || null,
      campus_id: body.campusId || null,
      canteen_id: body.canteenId || null,
      is_active: body.isActive ?? true,
      is_published: body.isPublished ?? true,
      created_by: ctx.user.id,
    })
    .select("id, code")
    .single();

  if (error) {
    const message = error.message?.includes("duplicate key") ? "A promo code with this code already exists." : "Failed to create promo code.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, promoCode: data });
}
