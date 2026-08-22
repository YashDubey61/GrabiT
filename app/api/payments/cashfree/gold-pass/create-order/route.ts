import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createCashfreeOrder, isCashfreeConfigured, getPaymentModeLabel } from "@/lib/payments/cashfree";
import { GOLD_PASS_PLANS, isGoldPlanId } from "@/lib/payments/gold_plans";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Starts a GRABIT Gold Pass purchase. Mirrors the wallet top-up Cashfree
 * flow (create-order → payment_session_id → Cashfree Checkout → verified
 * webhook), but activates a `subscriptions` row instead of crediting the
 * wallet. The pass is only ever activated by confirm_gold_pass_payment,
 * called from the webhook (or the status route's reconciliation
 * fallback) — never from this route.
 */
export async function POST(request: Request) {
  if (!isCashfreeConfigured()) {
    return NextResponse.json({ ok: false, error: "Online payments are not configured yet." }, { status: 503 });
  }

  const supabaseServer = await createServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabaseServer.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: "Please sign in to get GrabIt Gold." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { planId?: unknown } | null;
  const planId = body?.planId;
  if (!isGoldPlanId(planId)) {
    return NextResponse.json({ ok: false, error: "Select a valid Gold Pass plan." }, { status: 400 });
  }

  // Server-trusted price — the client only ever sends planId, never amount.
  const plan = GOLD_PASS_PLANS[planId];

  const admin = getSupabaseAdminClient();
  const { data: userRow } = await admin.from("users").select("full_name, email, phone").eq("id", user.id).maybeSingle();

  // Distinct GRABIT-GOLD- prefix so the shared webhook routes this to the
  // Gold Pass handler, never the food-order/wallet/payout ones.
  const cashfreeOrderId = `GRABIT-GOLD-${randomUUID()}`;

  try {
    const cfOrder = await createCashfreeOrder({
      orderId: cashfreeOrderId,
      orderAmount: plan.amount,
      customerDetails: {
        customerId: user.id,
        customerName: userRow?.full_name ?? undefined,
        customerEmail: userRow?.email ?? undefined,
        customerPhone: userRow?.phone && userRow.phone.trim() ? userRow.phone : "9999999999",
      },
      orderNote: `GrabIt Gold Pass — ${plan.label}`,
    });

    const { error: intentErr } = await admin.rpc("create_gold_pass_payment_intent", {
      p_user_id: user.id,
      p_plan_type: planId,
      p_amount: plan.amount,
      p_cashfree_order_id: cashfreeOrderId,
    });

    if (intentErr) {
      console.error("create_gold_pass_payment_intent RPC error:", intentErr);
      return NextResponse.json({ ok: false, error: "Couldn't start your Gold Pass purchase. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      paymentSessionId: cfOrder.payment_session_id,
      cashfreeOrderId,
      paymentMode: getPaymentModeLabel(),
      planId,
      amount: plan.amount,
    });
  } catch (err) {
    console.error("Gold Pass Cashfree order creation failed:", err);
    return NextResponse.json({ ok: false, error: "Couldn't start your Gold Pass purchase. Please try again." }, { status: 502 });
  }
}
