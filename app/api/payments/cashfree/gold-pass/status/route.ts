import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getCashfreeOrderStatus } from "@/lib/payments/cashfree";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/** Student polls this after closing Cashfree checkout while waiting for
 * the webhook — mirrors /api/payments/cashfree/wallet-topup/status. Falls
 * back to asking Cashfree directly if still PENDING past a short window;
 * never activates the pass itself, only reads/reconciles via the same
 * confirm_gold_pass_payment RPC the webhook uses. */
export async function GET(request: Request) {
  const supabaseServer = await createServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cashfreeOrderId = searchParams.get("cashfreeOrderId");
  if (!cashfreeOrderId) {
    return NextResponse.json({ ok: false, error: "cashfreeOrderId is required." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const { data: payment } = await admin
    .from("gold_pass_payments")
    .select("status, user_id, plan_type, expires_at")
    .eq("cashfree_order_id", cashfreeOrderId)
    .maybeSingle();

  // Ownership check — a student may only ever poll their own payment.
  if (!payment || payment.user_id !== user.id) {
    return NextResponse.json({ ok: false, error: "Payment not found." }, { status: 404 });
  }

  if (payment.status === "PENDING") {
    try {
      const cfStatus = await getCashfreeOrderStatus(cashfreeOrderId);
      const orderStatus = (cfStatus as { order_status?: string })?.order_status;
      if (orderStatus === "PAID") {
        const { data: result } = await admin.rpc("confirm_gold_pass_payment", {
          p_cashfree_order_id: cashfreeOrderId,
          p_cashfree_payment_id: null,
          p_status: "SUCCESS",
        });
        const confirmResult = result as { status?: string; planType?: string; expiresAt?: string } | null;
        return NextResponse.json({
          ok: true,
          status: confirmResult?.status ?? "PAID",
          planType: confirmResult?.planType ?? payment.plan_type,
          expiresAt: confirmResult?.expiresAt ?? payment.expires_at,
        });
      }
    } catch {
      // Fall through to the DB-known status.
    }
  }

  return NextResponse.json({
    ok: true,
    status: payment.status,
    planType: payment.plan_type,
    expiresAt: payment.expires_at,
  });
}
