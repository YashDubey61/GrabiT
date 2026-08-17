import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { DELIVERY_CHARGE_REASONS, DEFAULT_DELIVERY_CHARGE } from "@/lib/orders/delivery_charge";

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createAdminClient(url, key);
}

export async function GET() {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "delivery_charge")
    .maybeSingle();

  return NextResponse.json({ ok: true, config: data?.value ?? DEFAULT_DELIVERY_CHARGE });
}

/** Only a verified Super Admin (role checked server-side against
 * public.users, never trusted from the client) can change the
 * authoritative delivery charge used by order creation. */
export async function PATCH(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const body = (await request.json()) as {
    amount?: unknown;
    chargeType?: unknown;
    reason?: unknown;
    description?: unknown;
  };

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ ok: false, error: "Invalid charge amount." }, { status: 400 });
  }

  const chargeType = body.chargeType === "rule_based" ? "rule_based" : "fixed";

  const reason = DELIVERY_CHARGE_REASONS.includes(body.reason as never)
    ? (body.reason as string)
    : "Standard Delivery";

  const description = typeof body.description === "string" ? body.description.trim() : "";

  const value = { amount, chargeType, reason, description };

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("platform_settings").upsert({
    key: "delivery_charge",
    value,
    updated_at: new Date().toISOString(),
    updated_by: adminCtx.user.id,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "Unable to save settings." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, config: value });
}
