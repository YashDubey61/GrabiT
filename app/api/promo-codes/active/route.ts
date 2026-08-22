import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/** Published, active, in-window promo codes for the student's own
 * campus (or campus-unrestricted codes) — feeds the "View Promo
 * Codes" bottom sheet. Read-only. */
export async function GET() {
  const supabaseServer = await createServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  const { data: profile } = await admin.from("users").select("campus_id").eq("id", user.id).maybeSingle();

  const { data, error } = await admin.rpc("get_active_promo_codes", { p_campus_id: profile?.campus_id ?? null });
  if (error) {
    return NextResponse.json({ ok: false, error: "Failed to load promo codes." }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const codes = (data as any[]).map((p) => ({
    id: p.id,
    code: p.code,
    description: p.description,
    discountType: p.discount_type,
    discountValue: Number(p.discount_value),
    maxDiscount: p.max_discount !== null ? Number(p.max_discount) : null,
    minOrderValue: Number(p.min_order_value),
    expiresAt: p.expires_at,
  }));

  return NextResponse.json({ ok: true, promoCodes: codes });
}
