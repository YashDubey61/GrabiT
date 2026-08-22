import { NextResponse } from "next/server";
import { verifyCashfreeWebhookSignature } from "@/lib/payments/cashfree";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface CashfreeWebhookPayload {
  type: string;
  event_time?: string;
  data: {
    order?: { order_id: string; order_amount?: number; order_currency?: string };
    payment?: {
      cf_payment_id: string;
      payment_status: "SUCCESS" | "FAILED" | "PENDING" | "USER_DROPPED" | "CANCELLED" | string;
      payment_amount?: number;
      payment_currency?: string;
      payment_message?: string;
      payment_time?: string;
    };
    refund?: {
      cf_payment_id: string;
      refund_id: string;
      refund_status: "SUCCESS" | "PENDING" | "FAILED" | string;
      refund_amount?: number;
    };
  };
}

/**
 * Server-authoritative Cashfree webhook. Mirrors the structural pattern
 * of app/api/webhooks/razorpay/route.ts: verify signature over the raw
 * body first, then dedupe via payment_webhook_events before touching
 * any money-adjacent row. Routes to either a customer order payment or
 * a student GrabIt Wallet top-up, or a Super Admin payout-wallet fund
 * addition, or a student's GRABIT Gold Pass activation — purely by the
 * Cashfree order_id prefix set at creation time (GRABIT-ORDER-… /
 * GRABIT-WALLET-… / GRABIT-FUND-… / GRABIT-GOLD-…) — no extra
 * lookup required, and a forged prefix can't do anything because the
 * corresponding payments/topup/ledger row must already exist.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");
  const timestamp = request.headers.get("x-webhook-timestamp");

  if (!signature || !timestamp) {
    return NextResponse.json({ ok: false, error: "Missing webhook signature." }, { status: 400 });
  }
  if (!verifyCashfreeWebhookSignature(rawBody, timestamp, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: CashfreeWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid webhook body." }, { status: 400 });
  }

  const orderId = payload.data?.order?.order_id ?? "";
  const cfPaymentId = payload.data?.payment?.cf_payment_id ?? payload.data?.refund?.refund_id ?? "";
  const eventId = `${payload.type}:${orderId}:${cfPaymentId}`;

  const admin = getSupabaseAdminClient();

  // Idempotency gate — identical to the Razorpay webhook's approach:
  // record the event first; if it's already there, this delivery
  // (Cashfree retries on non-2xx, and can also just double-send) is a
  // safe no-op.
  const { data: existingEvent } = await admin
    .from("payment_webhook_events")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existingEvent) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  await admin.from("payment_webhook_events").insert({
    event_id: eventId,
    event_type: payload.type,
    gateway: "cashfree",
    cashfree_order_id: orderId,
    cashfree_payment_id: cfPaymentId || null,
    status: payload.data?.payment?.payment_status ?? payload.data?.refund?.refund_status ?? null,
    payload_summary: { type: payload.type, orderId, amount: payload.data?.payment?.payment_amount ?? payload.data?.refund?.refund_amount },
    processed_at: new Date().toISOString(),
  });

  try {
    if (orderId.startsWith("GRABIT-FUND-")) {
      await handleFundAdditionEvent(admin, payload, orderId, cfPaymentId);
    } else if (orderId.startsWith("GRABIT-WALLET-")) {
      await handleWalletTopUpEvent(admin, payload, orderId, cfPaymentId);
    } else if (orderId.startsWith("GRABIT-ORDER-")) {
      await handleOrderPaymentEvent(admin, payload, orderId, cfPaymentId);
    } else if (orderId.startsWith("GRABIT-GOLD-")) {
      await handleGoldPassEvent(admin, payload, orderId, cfPaymentId);
    }
    // Unknown prefixes are logged (via payment_webhook_events above) and
    // otherwise ignored — never guess at what to update.
  } catch (err) {
    console.error("Cashfree webhook processing error:", err);
    // Still 200 — Cashfree would otherwise retry indefinitely on an
    // already-logged event; the audit row above preserves the payload
    // for manual investigation.
  }

  return NextResponse.json({ ok: true });
}

async function handleOrderPaymentEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  payload: CashfreeWebhookPayload,
  cashfreeOrderId: string,
  cfPaymentId: string,
) {
  const { data: payment } = await admin
    .from("payments")
    .select("id, order_id, amount, status")
    .eq("cashfree_order_id", cashfreeOrderId)
    .maybeSingle();

  if (!payment) return; // No matching payment — nothing safe to do.
  if (payment.status === "success" || payment.status === "refunded") return; // Already finalized — idempotent.

  const paymentStatus = payload.data?.payment?.payment_status;
  const reportedAmount = payload.data?.payment?.payment_amount;

  if (payload.type === "REFUND_STATUS_WEBHOOK") {
    const refundStatus = payload.data?.refund?.refund_status;
    if (refundStatus === "SUCCESS") {
      await admin
        .from("payments")
        .update({
          status: "refunded",
          gateway_response: payload.data,
          webhook_received_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);
    }
    return;
  }

  if (paymentStatus === "SUCCESS") {
    // Never trust the webhook's amount blindly — it must match what we
    // computed and sent to Cashfree at order-creation time.
    if (reportedAmount !== undefined && Math.abs(Number(reportedAmount) - Number(payment.amount)) > 0.01) {
      console.error("Cashfree webhook amount mismatch — refusing to mark paid.", {
        cashfreeOrderId,
        expected: payment.amount,
        reported: reportedAmount,
      });
      return;
    }

    await admin
      .from("payments")
      .update({
        status: "success",
        cashfree_payment_id: cfPaymentId || null,
        gateway_response: payload.data,
        webhook_received_at: new Date().toISOString(),
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    try {
      const { createStudentNotification } = await import("@/lib/notifications/student_notifications");
      const { data: orderRow } = await admin.from("orders").select("student_id, order_number").eq("id", payment.order_id).maybeSingle();
      if (orderRow) {
        await createStudentNotification({
          userId: orderRow.student_id,
          type: "PAYMENT_SUCCESS",
          title: "Payment successful",
          message: `Your payment for order ${orderRow.order_number} was successful.`,
          severity: "SUCCESS",
          category: "PAYMENTS",
          relatedOrderId: payment.order_id,
          actionUrl: `/customer/orders/${payment.order_id}`,
          dedupeKey: `cashfree-paid:${payment.id}`,
        });
      }
    } catch {
      // Non-critical.
    }

    // Order confirmation email — this is the actual payment-confirmed
    // moment for a prepaid (Cashfree) order, mirroring the wallet-order
    // confirmation email sent in app/api/orders/route.ts. Never blocks
    // or fails the webhook; sendOrderConfirmationEmail is idempotent
    // per order id, so a Cashfree webhook retry can never double-send.
    try {
      await sendOrderConfirmationEmailForOrder(admin, payment.order_id);
    } catch (emailErr) {
      console.warn("Non-critical order confirmation email error (Cashfree webhook):", emailErr);
    }
  } else if (paymentStatus === "FAILED" || paymentStatus === "USER_DROPPED" || paymentStatus === "CANCELLED") {
    await admin
      .from("payments")
      .update({
        status: "failed",
        gateway_response: payload.data,
        webhook_received_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    // A failed/abandoned payment means the order was never actually
    // paid for — cancel it so the vendor never sees or preps it.
    await admin
      .from("orders")
      .update({ status: "cancelled", cancellation_reason: "Payment not completed" })
      .eq("id", payment.order_id)
      .eq("status", "placed");

    // Refund the promo code usage — it was reserved optimistically at
    // order-creation time (before the async Cashfree payment resolved),
    // so an abandoned/failed payment must not permanently burn it.
    await admin.from("promo_code_redemptions").delete().eq("order_id", payment.order_id);
    await admin.from("orders").update({ promo_code_id: null, promo_code: null, promo_discount: 0 }).eq("id", payment.order_id);
  }
  // PENDING: leave the payment row as-is; a later webhook will resolve it.
}

async function handleWalletTopUpEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  payload: CashfreeWebhookPayload,
  cashfreeOrderId: string,
  cfPaymentId: string,
) {
  const paymentStatus = payload.data?.payment?.payment_status;
  if (paymentStatus !== "SUCCESS" && paymentStatus !== "FAILED") return; // Ignore PENDING/other.

  if (paymentStatus === "SUCCESS") {
    const reportedAmount = payload.data?.payment?.payment_amount;
    const { data: topup } = await admin
      .from("wallet_topups")
      .select("topup_amount, status")
      .eq("cashfree_order_id", cashfreeOrderId)
      .maybeSingle();

    if (!topup) return; // No matching top-up intent — nothing safe to do.
    if (topup.status !== "PENDING") return; // Already finalized — confirm_wallet_topup is idempotent anyway.

    // Never trust the webhook's amount blindly — it must match what
    // was sent to Cashfree at top-up-intent creation time.
    if (reportedAmount !== undefined && Math.abs(Number(reportedAmount) - Number(topup.topup_amount)) > 0.01) {
      console.error("Cashfree wallet top-up amount mismatch — refusing to credit.", {
        cashfreeOrderId,
        expected: topup.topup_amount,
        reported: reportedAmount,
      });
      return;
    }
  }

  const { data: result } = await admin.rpc("confirm_wallet_topup", {
    p_cashfree_order_id: cashfreeOrderId,
    p_cashfree_payment_id: cfPaymentId || null,
    p_status: paymentStatus,
  });

  const confirmResult = result as { userId?: string; status?: string; alreadyProcessed?: boolean; newBalance?: number; totalWalletCredit?: number } | null;

  if (confirmResult?.status === "SUCCESS" && !confirmResult.alreadyProcessed && confirmResult.userId) {
    try {
      const { createStudentNotification } = await import("@/lib/notifications/student_notifications");
      await createStudentNotification({
        userId: confirmResult.userId,
        type: "WALLET_TOPUP",
        title: "Wallet topped up",
        message: `₹${Number(confirmResult.newBalance ?? 0).toFixed(2)} is your new GrabIt Wallet balance.`,
        severity: "SUCCESS",
        category: "WALLET",
        actionUrl: "/customer/wallet",
        dedupeKey: `wallet-topup:${cashfreeOrderId}`,
      });
    } catch {
      // Non-critical.
    }
  }
}

async function handleGoldPassEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  payload: CashfreeWebhookPayload,
  cashfreeOrderId: string,
  cfPaymentId: string,
) {
  const paymentStatus = payload.data?.payment?.payment_status;
  if (paymentStatus !== "SUCCESS" && paymentStatus !== "FAILED" && paymentStatus !== "CANCELLED" && paymentStatus !== "USER_DROPPED") {
    return; // Ignore PENDING/other.
  }

  if (paymentStatus === "SUCCESS") {
    const reportedAmount = payload.data?.payment?.payment_amount;
    const { data: payment } = await admin
      .from("gold_pass_payments")
      .select("amount, status")
      .eq("cashfree_order_id", cashfreeOrderId)
      .maybeSingle();

    if (!payment) return; // No matching payment intent — nothing safe to do.
    if (payment.status !== "PENDING") return; // Already finalized — confirm_gold_pass_payment is idempotent anyway.

    // Never trust the webhook's amount blindly — it must match what was
    // sent to Cashfree at payment-intent creation time (the server-priced
    // ₹49/₹199, never a client-supplied amount).
    if (reportedAmount !== undefined && Math.abs(Number(reportedAmount) - Number(payment.amount)) > 0.01) {
      console.error("Cashfree Gold Pass amount mismatch — refusing to activate.", {
        cashfreeOrderId,
        expected: payment.amount,
        reported: reportedAmount,
      });
      return;
    }
  }

  const mappedStatus = paymentStatus === "USER_DROPPED" ? "CANCELLED" : paymentStatus;

  const { data: result } = await admin.rpc("confirm_gold_pass_payment", {
    p_cashfree_order_id: cashfreeOrderId,
    p_cashfree_payment_id: cfPaymentId || null,
    p_status: mappedStatus === "CANCELLED" ? "CANCELLED" : mappedStatus,
  });

  const confirmResult = result as
    | { userId?: string; status?: string; alreadyProcessed?: boolean; planType?: string; expiresAt?: string }
    | null;

  if (confirmResult?.status === "PAID" && !confirmResult.alreadyProcessed && confirmResult.userId) {
    try {
      const { createStudentNotification } = await import("@/lib/notifications/student_notifications");
      const planLabel = confirmResult.planType === "SEMESTER" ? "Semester" : "Monthly";
      await createStudentNotification({
        userId: confirmResult.userId,
        type: "GOLD_ACTIVATED",
        title: "GrabIt Gold activated",
        message: `Your ${planLabel} Gold Pass is active. Enjoy your perks!`,
        severity: "SUCCESS",
        category: "GOLD",
        actionUrl: "/customer/profile",
        dedupeKey: `gold-pass-activated:${cashfreeOrderId}`,
      });
    } catch {
      // Non-critical.
    }
  }
}

async function handleFundAdditionEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  payload: CashfreeWebhookPayload,
  cashfreeOrderId: string,
  cfPaymentId: string,
) {
  const paymentStatus = payload.data?.payment?.payment_status;
  if (paymentStatus !== "SUCCESS" && paymentStatus !== "FAILED") return; // Ignore PENDING/other for the ledger.

  await admin.rpc("confirm_fund_addition", {
    p_cashfree_order_id: cashfreeOrderId,
    p_cashfree_payment_id: cfPaymentId || null,
    p_status: paymentStatus,
  });
}

/**
 * Gathers the real order/items/vendor/student data and sends the
 * order confirmation email for a prepaid order whose payment just
 * succeeded. Reads only — never recomputes pricing (all values come
 * straight from the already-authoritative orders/order_items rows).
 */
async function sendOrderConfirmationEmailForOrder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  orderId: string,
) {
  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, student_id, canteen_id, total_amount, delivery_charge, promo_discount, created_at")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  const [{ data: items }, { data: canteen }, { data: authUser }, { data: studentRow }] = await Promise.all([
    admin
      .from("order_items")
      .select("quantity, price_at_order, menu_items(name)")
      .eq("order_id", orderId),
    admin.from("canteens").select("name, pickup_location").eq("id", order.canteen_id).maybeSingle(),
    admin.auth.admin.getUserById(order.student_id),
    admin.from("users").select("full_name").eq("id", order.student_id).maybeSingle(),
  ]);

  const customerEmail: string | undefined = authUser?.user?.email;
  if (!customerEmail) return;

  const lineItems = (items ?? []).map((i: { quantity: number; price_at_order: number; menu_items?: { name?: string } }) => ({
    name: i.menu_items?.name ?? "Item",
    quantity: i.quantity,
    price: Number(i.price_at_order),
  }));
  const subtotal = lineItems.reduce((sum: number, i: { quantity: number; price: number }) => sum + i.price * i.quantity, 0);
  const discount = Number(order.promo_discount || 0);
  const deliveryFee = Number(order.delivery_charge || 0);

  const { sendOrderConfirmationEmail } = await import("@/lib/email/email-service");
  await sendOrderConfirmationEmail({
    orderId: order.id,
    customerEmail,
    data: {
      customerName: studentRow?.full_name || "GRABIT Student",
      orderNumber: order.order_number ?? order.id.slice(0, 6),
      orderDateIso: order.created_at,
      vendorName: canteen?.name || "Campus Canteen",
      items: lineItems,
      subtotal,
      discount,
      deliveryFee,
      total: Number(order.total_amount),
      pickupLocation: canteen?.pickup_location ?? null,
    },
  });
}
