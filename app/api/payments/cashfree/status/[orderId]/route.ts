import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getCashfreeOrderStatus, getCashfreeOrderPayments, mapCashfreeStatusToInternal, isCashfreeConfigured } from "@/lib/payments/cashfree";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{
    orderId: string;
  }>;
}

/**
 * Reconciles the live Cashfree payment status for an order or wallet top-up.
 * Queries Cashfree's server-authoritative status and updates internal DB state.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { orderId } = await params;

    if (!orderId || !orderId.trim()) {
      return NextResponse.json({ ok: false, error: "Order ID is required." }, { status: 400 });
    }

    const supabaseServer = await createServerClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();

    const admin = getSupabaseAdminClient();

    // 1. Check if this is a wallet top-up (starts with GRABIT-WALLET- or exists in wallet_topups)
    const { data: topup } = await admin
      .from("wallet_topups")
      .select("id, status, user_id, topup_amount, bonus_amount, total_wallet_credit, cashfree_order_id, cashfree_payment_id")
      .eq("cashfree_order_id", orderId)
      .maybeSingle();

    if (topup) {
      if (user && topup.user_id !== user.id) {
        return NextResponse.json({ ok: false, error: "Unauthorized access to top-up." }, { status: 403 });
      }

      if (topup.status === "PENDING" && isCashfreeConfigured()) {
        try {
          const cfStatus = (await getCashfreeOrderStatus(orderId)) as { order_status?: string; order_amount?: number };
          const internalStatus = mapCashfreeStatusToInternal(cfStatus?.order_status);

          if (internalStatus === "SUCCESS") {
            let cfPaymentId: string | null = null;
            try {
              const payments = (await getCashfreeOrderPayments(orderId)) as Array<{ payment_status?: string; cf_payment_id?: string }>;
              const successfulPayment = payments.find((p) => p.payment_status === "SUCCESS");
              if (successfulPayment?.cf_payment_id) {
                cfPaymentId = String(successfulPayment.cf_payment_id);
              }
            } catch {
              // Non-fatal
            }

            await admin.rpc("confirm_wallet_topup", {
              p_cashfree_order_id: orderId,
              p_cashfree_payment_id: cfPaymentId,
              p_status: "SUCCESS",
            });

            return NextResponse.json({
              ok: true,
              orderId,
              cashfreeOrderId: orderId,
              status: "SUCCESS",
              paymentStatus: "SUCCESS",
              orderStatus: "PAID",
              amount: topup.topup_amount,
              totalWalletCredit: topup.total_wallet_credit,
              bonusAmount: topup.bonus_amount,
            });
          }

          if (internalStatus === "FAILED") {
            await admin.rpc("confirm_wallet_topup", {
              p_cashfree_order_id: orderId,
              p_cashfree_payment_id: null,
              p_status: "FAILED",
            });

            return NextResponse.json({
              ok: true,
              orderId,
              cashfreeOrderId: orderId,
              status: "FAILED",
              paymentStatus: "FAILED",
              orderStatus: cfStatus?.order_status || "FAILED",
            });
          }
        } catch (err) {
          console.error("Failed to reconcile Cashfree wallet status:", err);
        }
      }

      return NextResponse.json({
        ok: true,
        orderId,
        cashfreeOrderId: orderId,
        status: topup.status,
        paymentStatus: topup.status,
        orderStatus: topup.status,
        amount: topup.topup_amount,
        totalWalletCredit: topup.total_wallet_credit,
      });
    }

    // 2. Check if this is a food order (exists in payments or orders)
    const { data: paymentRow } = await admin
      .from("payments")
      .select("id, order_id, status, amount, cashfree_order_id, cashfree_payment_id")
      .or(`cashfree_order_id.eq.${orderId},order_id.eq.${orderId}`)
      .maybeSingle();

    if (paymentRow) {
      const cfOrderId = paymentRow.cashfree_order_id || orderId;

      if (paymentRow.status === "pending" && isCashfreeConfigured()) {
        try {
          const cfStatus = (await getCashfreeOrderStatus(cfOrderId)) as { order_status?: string };
          const internalStatus = mapCashfreeStatusToInternal(cfStatus?.order_status);

          if (internalStatus === "SUCCESS") {
            await admin
              .from("payments")
              .update({ status: "success", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
              .eq("id", paymentRow.id);

            return NextResponse.json({
              ok: true,
              orderId: paymentRow.order_id,
              cashfreeOrderId: cfOrderId,
              status: "SUCCESS",
              paymentStatus: "SUCCESS",
              orderStatus: "PAID",
              amount: paymentRow.amount,
            });
          }

          if (internalStatus === "FAILED") {
            await admin
              .from("payments")
              .update({ status: "failed", gateway_response: cfStatus, updated_at: new Date().toISOString() })
              .eq("id", paymentRow.id);

            await admin
              .from("orders")
              .update({ status: "cancelled", cancellation_reason: "Payment not completed" })
              .eq("id", paymentRow.order_id)
              .eq("status", "placed");

            return NextResponse.json({
              ok: true,
              orderId: paymentRow.order_id,
              cashfreeOrderId: cfOrderId,
              status: "FAILED",
              paymentStatus: "FAILED",
              orderStatus: "cancelled",
            });
          }
        } catch (err) {
          console.error("Failed to reconcile Cashfree order status:", err);
        }
      }

      const mappedStatus = mapCashfreeStatusToInternal(paymentRow.status);
      return NextResponse.json({
        ok: true,
        orderId: paymentRow.order_id,
        cashfreeOrderId: cfOrderId,
        status: mappedStatus,
        paymentStatus: paymentRow.status,
        amount: paymentRow.amount,
      });
    }

    // 3. Fallback direct Cashfree query for arbitrary Cashfree Order ID
    if (isCashfreeConfigured()) {
      try {
        const cfStatus = (await getCashfreeOrderStatus(orderId)) as { order_status?: string; order_amount?: number };
        const internalStatus = mapCashfreeStatusToInternal(cfStatus?.order_status);
        return NextResponse.json({
          ok: true,
          orderId,
          cashfreeOrderId: orderId,
          status: internalStatus,
          orderStatus: cfStatus?.order_status || "UNKNOWN",
          rawStatus: cfStatus?.order_status,
          amount: cfStatus?.order_amount,
        });
      } catch (err) {
        return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
      }
    }

    return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
  } catch (err) {
    console.error("Status route error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}
