import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getCashfreeOrderStatus } from "@/lib/payments/cashfree";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/** Student polls this after closing Cashfree checkout while waiting for
 * the webhook — mirrors /api/payments/cashfree/status for food orders.
 * Falls back to asking Cashfree directly if still PENDING past a short
 * window; never credits anything itself, only reads/reconciles. */
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
  const { data: topup } = await admin
    .from("wallet_topups")
    .select("status, user_id, total_wallet_credit")
    .eq("cashfree_order_id", cashfreeOrderId)
    .maybeSingle();

  if (!topup || topup.user_id !== user.id) {
    return NextResponse.json({ ok: false, error: "Top-up not found." }, { status: 404 });
  }

  if (topup.status === "PENDING") {
    try {
      const cfStatus = (await getCashfreeOrderStatus(cashfreeOrderId)) as { order_status?: string };
      const orderStatus = cfStatus?.order_status;
      if (orderStatus === "PAID") {
        let paymentId: string | null = null;
        try {
          const payments = (await (await import("@/lib/payments/cashfree")).getCashfreeOrderPayments(cashfreeOrderId)) as Array<{ payment_status?: string; cf_payment_id?: string }>;
          const successfulPayment = payments.find((p) => p.payment_status === "SUCCESS");
          if (successfulPayment?.cf_payment_id) {
            paymentId = String(successfulPayment.cf_payment_id);
          }
        } catch {
          // Non-fatal
        }

        await admin.rpc("confirm_wallet_topup", {
          p_cashfree_order_id: cashfreeOrderId,
          p_cashfree_payment_id: paymentId,
          p_status: "SUCCESS",
        });
        return NextResponse.json({ ok: true, status: "SUCCESS", totalWalletCredit: topup.total_wallet_credit });
      }

      if (orderStatus === "EXPIRED" || orderStatus === "TERMINATED" || orderStatus === "TERMINATION_REQUESTED") {
        await admin.rpc("confirm_wallet_topup", {
          p_cashfree_order_id: cashfreeOrderId,
          p_cashfree_payment_id: null,
          p_status: "FAILED",
        });
        return NextResponse.json({ ok: true, status: "FAILED" });
      }
    } catch {
      // Fall through to the DB-known status.
    }
  }

  return NextResponse.json({ ok: true, status: topup.status, totalWalletCredit: topup.total_wallet_credit });
}
