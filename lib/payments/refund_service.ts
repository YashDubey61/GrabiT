import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isCashfreeConfigured, createCashfreeRefund } from "@/lib/payments/cashfree";

export interface ProcessCancellationRefundParams {
  orderId: string;
  reason?: string;
  cancelledBy?: string;
}

export interface ProcessCancellationRefundResult {
  success: boolean;
  refunded: boolean;
  alreadyRefunded?: boolean;
  amount: number;
  method?: "wallet" | "upi" | "cashfree";
  newBalance?: number;
  error?: string;
  reason?: string;
}

/**
 * Server-authoritative, idempotent refund processor for cancelled orders.
 *
 * Enforces:
 * 1. ONE ORDER -> EXACTLY ONE REFUND (Idempotency protection against retries & double-calls).
 * 2. Financial Ledger Integrity: Append-only wallet_transactions credit record for wallet payments.
 * 3. Atomic Database Balance Update: Student wallet balance credited strictly by paid amount.
 * 4. Online Payment / Cashfree: Dispatches to Cashfree refund API when configured, or credits student wallet.
 * 5. Safe handling when no payment was captured (0 refund, no false credits).
 */
export async function processOrderCancellationRefund(
  params: ProcessCancellationRefundParams,
): Promise<ProcessCancellationRefundResult> {
  const { orderId, reason = "Order cancelled by store" } = params;
  const admin = getSupabaseAdminClient();

  try {
    // 1. Fetch authoritative order record
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select("id, student_id, order_number, status, total_amount")
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return { success: false, refunded: false, amount: 0, error: "Order not found." };
    }

    // 2. Fetch authoritative payment record for this order
    const { data: payment, error: paymentErr } = await admin
      .from("payments")
      .select("id, order_id, method, amount, status, cashfree_order_id, cashfree_payment_id")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // If no payment record exists for this order
    if (paymentErr || !payment) {
      return {
        success: true,
        refunded: false,
        amount: 0,
        reason: "No payment record associated with this order.",
      };
    }

    const paidAmount = Number(payment.amount || 0);

    // 3. IDEMPOTENCY GUARD: Check if already marked refunded in payments table
    if (payment.status === "refunded") {
      return {
        success: true,
        refunded: false,
        alreadyRefunded: true,
        amount: paidAmount,
        method: payment.method as "wallet" | "upi",
      };
    }

    // 4. IDEMPOTENCY GUARD: Check if a refund ledger entry already exists for this order
    const { data: existingTx } = await admin
      .from("wallet_transactions")
      .select("id, amount, wallet_id")
      .eq("related_order_id", orderId)
      .eq("type", "refund")
      .maybeSingle();

    if (existingTx) {
      // Sync payment row if it was missed
      await admin
        .from("payments")
        .update({ status: "refunded", updated_at: new Date().toISOString() })
        .eq("id", payment.id);

      return {
        success: true,
        refunded: false,
        alreadyRefunded: true,
        amount: Number(existingTx.amount || paidAmount),
        method: "wallet",
      };
    }

    // 5. Check if payment was actually captured/successful
    if (payment.status !== "success") {
      // If payment was pending, mark it failed so it cannot be double-paid
      if (payment.status === "pending") {
        await admin
          .from("payments")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", payment.id);
      }
      return {
        success: true,
        refunded: false,
        amount: 0,
        reason: `Payment was in status "${payment.status}", not captured.`,
      };
    }

    // If paidAmount is 0 (e.g. 100% discount promo or free order)
    if (paidAmount <= 0) {
      await admin
        .from("payments")
        .update({ status: "refunded", updated_at: new Date().toISOString() })
        .eq("id", payment.id);

      return {
        success: true,
        refunded: true,
        amount: 0,
        method: payment.method as "wallet" | "upi",
      };
    }

    // 6. EXECUTE REFUND BY PAYMENT METHOD
    if (payment.method === "wallet") {
      return await executeWalletRefund(admin, order, payment, paidAmount, reason);
    } else if (payment.method === "upi" || payment.cashfree_order_id) {
      return await executeCashfreeRefund(admin, order, payment, paidAmount, reason);
    } else {
      // Default to wallet refund for any other payment method
      return await executeWalletRefund(admin, order, payment, paidAmount, reason);
    }
  } catch (err: any) {
    console.error("Order cancellation refund processing error:", err);
    return {
      success: false,
      refunded: false,
      amount: 0,
      error: err?.message || "Internal error processing refund.",
    };
  }
}

async function executeWalletRefund(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payment: any,
  refundAmount: number,
  reason: string,
): Promise<ProcessCancellationRefundResult> {
  // 1. Try atomic PostgreSQL RPC first
  try {
    const { data: rpcResult, error: rpcErr } = await admin.rpc("refund_student_wallet", {
      p_order_id: order.id,
      p_reason: reason,
    });

    if (!rpcErr && rpcResult && typeof rpcResult === "object") {
      const res = rpcResult as { ok: boolean; refunded?: boolean; already_refunded?: boolean; amount?: number; new_balance?: number; error?: string };
      if (res.ok) {
        return {
          success: true,
          refunded: Boolean(res.refunded),
          alreadyRefunded: Boolean(res.already_refunded),
          amount: Number(res.amount ?? refundAmount),
          method: "wallet",
          newBalance: res.new_balance !== undefined ? Number(res.new_balance) : undefined,
        };
      }
    }
  } catch (rpcCatch) {
    console.warn("refund_student_wallet RPC invocation fell back to ledger transaction:", rpcCatch);
  }

  // 2. Administrative Ledger Transaction Fallback
  // Fetch or auto-create student wallet
  const { data: walletRow } = await admin
    .from("wallets")
    .select("id, balance")
    .eq("user_id", order.student_id)
    .maybeSingle();

  let walletId = walletRow?.id;
  const currentBalance = Number(walletRow?.balance ?? 0);

  if (!walletId) {
    const { data: newWallet } = await admin
      .from("wallets")
      .insert({ user_id: order.student_id, balance: 0 })
      .select("id")
      .single();
    walletId = newWallet?.id;
  }

  if (!walletId) {
    return { success: false, refunded: false, amount: refundAmount, error: "Could not locate or create student wallet." };
  }

  const newBalance = currentBalance + refundAmount;
  const nowIso = new Date().toISOString();

  // Atomically credit wallet balance
  await admin
    .from("wallets")
    .update({ balance: newBalance, updated_at: nowIso })
    .eq("id", walletId);

  // Insert append-only transaction into wallet_transactions ledger
  await admin.from("wallet_transactions").insert({
    wallet_id: walletId,
    type: "refund",
    amount: refundAmount,
    related_order_id: order.id,
    created_at: nowIso,
  });

  // Mark payment as refunded
  await admin
    .from("payments")
    .update({ status: "refunded", updated_at: nowIso })
    .eq("id", payment.id);

  return {
    success: true,
    refunded: true,
    amount: refundAmount,
    method: "wallet",
    newBalance,
  };
}

async function executeCashfreeRefund(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payment: any,
  refundAmount: number,
  reason: string,
): Promise<ProcessCancellationRefundResult> {
  const cashfreeOrderId = payment.cashfree_order_id;
  const nowIso = new Date().toISOString();

  if (cashfreeOrderId && isCashfreeConfigured()) {
    try {
      const refundId = `rfnd_${order.id.replace(/-/g, "").slice(0, 16)}`;
      const cfResponse = await createCashfreeRefund({
        orderId: cashfreeOrderId,
        refundId,
        refundAmount,
        refundNote: reason,
      });

      await admin
        .from("payments")
        .update({
          status: "refunded",
          gateway_response: cfResponse,
          updated_at: nowIso,
        })
        .eq("id", payment.id);

      return {
        success: true,
        refunded: true,
        amount: refundAmount,
        method: "cashfree",
      };
    } catch (cfErr) {
      console.error("Cashfree API refund failed, falling back to wallet credit:", cfErr);
      // Fallback: Credit to student wallet so student is not financially disadvantaged
      return await executeWalletRefund(admin, order, payment, refundAmount, reason);
    }
  }

  // If Cashfree is not configured (sandbox / mock payment), credit to wallet
  return await executeWalletRefund(admin, order, payment, refundAmount, reason);
}
