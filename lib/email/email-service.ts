import "server-only";
import { getResendClient, getFromAddress, getReplyToAddress } from "./resend-client";
import { renderOrderConfirmationEmail, type OrderConfirmationEmailData } from "./templates/order-confirmation";
import { renderVendorDailyRevenueEmail } from "./templates/vendor-daily-revenue";
import { renderPasswordResetEmail } from "./templates/password-reset";
import type { CalculatedVendorSettlement } from "@/lib/telegram/settlement_calculator";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface EmailSendResult {
  ok: boolean;
  /** true when this was a no-op because the email was already sent for this idempotency key. */
  skipped?: boolean;
  error?: string;
}

type EmailType = "ORDER_CONFIRMATION" | "VENDOR_DAILY_REVENUE" | "PASSWORD_RESET";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any;

/**
 * Claims (or re-claims) an idempotency key in email_log before any
 * Resend call is made. Returns claimed:false when a SENT/DELIVERED row
 * already exists for this exact key — the caller must skip sending.
 * A PENDING/FAILED row is safe to retry and reuses the same log row.
 */
async function claimIdempotencyKey(
  admin: AdminClient,
  params: {
    emailType: EmailType;
    idempotencyKey: string;
    recipientEmail: string;
    relatedOrderId?: string;
    relatedCanteenId?: string;
  },
): Promise<{ claimed: boolean; logId?: string }> {
  const { data: existing } = await admin
    .from("email_log")
    .select("id, status")
    .eq("idempotency_key", params.idempotencyKey)
    .maybeSingle();

  if (existing) {
    if (existing.status === "SENT" || existing.status === "DELIVERED") {
      return { claimed: false, logId: existing.id };
    }
    return { claimed: true, logId: existing.id };
  }

  const { data: inserted, error } = await admin
    .from("email_log")
    .insert({
      email_type: params.emailType,
      recipient_email: params.recipientEmail,
      related_order_id: params.relatedOrderId ?? null,
      related_canteen_id: params.relatedCanteenId ?? null,
      idempotency_key: params.idempotencyKey,
      status: "PENDING",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    // Unique-constraint race: a concurrent request (e.g. a webhook
    // retry firing at the same instant) already inserted this key.
    const { data: raced } = await admin
      .from("email_log")
      .select("id, status")
      .eq("idempotency_key", params.idempotencyKey)
      .maybeSingle();
    if (raced && (raced.status === "SENT" || raced.status === "DELIVERED")) {
      return { claimed: false, logId: raced.id };
    }
    return { claimed: true, logId: raced?.id };
  }

  return { claimed: true, logId: inserted.id };
}

async function markLogResult(
  admin: AdminClient,
  logId: string | undefined,
  result: { status: "SENT" | "FAILED"; resendEmailId?: string; errorMessage?: string },
) {
  if (!logId) return;
  await admin
    .from("email_log")
    .update({
      status: result.status,
      resend_email_id: result.resendEmailId ?? null,
      error_message: result.errorMessage ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", logId);
}

/**
 * Sends the GRABIT order confirmation email. Never throws — a Resend
 * failure is logged and returned as { ok: false }, but must never
 * cause the caller to roll back or fail the (already-successful) order.
 * Idempotent per orderId: a second call for the same order is a no-op
 * once the first send reaches SENT.
 */
export async function sendOrderConfirmationEmail(params: {
  orderId: string;
  customerEmail: string;
  data: OrderConfirmationEmailData;
}): Promise<EmailSendResult> {
  const idempotencyKey = `order-confirmation-${params.orderId}`;
  const admin = getSupabaseAdminClient();

  try {
    const claim = await claimIdempotencyKey(admin, {
      emailType: "ORDER_CONFIRMATION",
      idempotencyKey,
      recipientEmail: params.customerEmail,
      relatedOrderId: params.orderId,
    });

    if (!claim.claimed) {
      return { ok: true, skipped: true };
    }

    if (!params.customerEmail || !params.customerEmail.trim()) {
      await markLogResult(admin, claim.logId, {
        status: "FAILED",
        errorMessage: "Customer has no email address on file.",
      });
      return { ok: false, error: "Customer has no email address on file." };
    }

    const { subject, html, text } = renderOrderConfirmationEmail(params.data);
    const resend = getResendClient();

    const { data: sendResult, error } = await resend.emails.send(
      {
        from: getFromAddress(),
        to: params.customerEmail,
        replyTo: getReplyToAddress(),
        subject,
        html,
        text,
      },
      { idempotencyKey },
    );

    if (error) {
      await markLogResult(admin, claim.logId, { status: "FAILED", errorMessage: error.message });
      console.error(`[Email Service] Order confirmation failed for order ${params.orderId}:`, error.message);
      return { ok: false, error: error.message };
    }

    await markLogResult(admin, claim.logId, { status: "SENT", resendEmailId: sendResult?.id });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email service error.";
    console.error(`[Email Service] Order confirmation threw for order ${params.orderId}:`, message);
    return { ok: false, error: message };
  }
}

/**
 * Sends the vendor daily revenue report email, rendered from the SAME
 * CalculatedVendorSettlement the cron/Super Admin settlement routes
 * already computed and sent to Telegram — no second calculation.
 * Idempotent per (canteenId, settlementDateStr, windowEndIso).
 */
export async function sendVendorDailyRevenueEmail(params: {
  vendorEmail: string;
  calc: CalculatedVendorSettlement;
  alreadyPaidAmount: number;
  payoutDue: number;
  status: "PENDING" | "PAID" | "PARTIALLY_PAID";
}): Promise<EmailSendResult> {
  const idempotencyKey = `vendor-daily-revenue-${params.calc.canteenId}-${params.calc.settlementDateStr}-${params.calc.windowEndIso}`;
  const admin = getSupabaseAdminClient();

  try {
    const claim = await claimIdempotencyKey(admin, {
      emailType: "VENDOR_DAILY_REVENUE",
      idempotencyKey,
      recipientEmail: params.vendorEmail,
      relatedCanteenId: params.calc.canteenId,
    });

    if (!claim.claimed) {
      return { ok: true, skipped: true };
    }

    if (!params.vendorEmail || !params.vendorEmail.trim()) {
      await markLogResult(admin, claim.logId, {
        status: "FAILED",
        errorMessage: "Vendor has no registered email address.",
      });
      return { ok: false, error: "Vendor has no registered email address." };
    }

    const { subject, html, text } = renderVendorDailyRevenueEmail(
      params.calc,
      params.alreadyPaidAmount,
      params.payoutDue,
      params.status,
    );
    const resend = getResendClient();

    const { data: sendResult, error } = await resend.emails.send(
      {
        from: getFromAddress(),
        to: params.vendorEmail,
        replyTo: getReplyToAddress(),
        subject,
        html,
        text,
      },
      { idempotencyKey },
    );

    if (error) {
      await markLogResult(admin, claim.logId, { status: "FAILED", errorMessage: error.message });
      console.error(`[Email Service] Vendor daily revenue failed for canteen ${params.calc.canteenId}:`, error.message);
      return { ok: false, error: error.message };
    }

    await markLogResult(admin, claim.logId, { status: "SENT", resendEmailId: sendResult?.id });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email service error.";
    console.error(`[Email Service] Vendor daily revenue threw for canteen ${params.calc.canteenId}:`, message);
    return { ok: false, error: message };
  }
}

/**
 * Sends the GrabIt-branded password reset email using a real Supabase
 * Auth recovery link (minted server-side via admin.generateLink, never
 * a hand-built URL). This replaces Supabase's own built-in mailer for
 * the recovery flow entirely — resetPasswordForEmail() must NOT also
 * be called for the same request, or the recipient gets two emails.
 * Idempotency is keyed per-minute so an accidental double-submit of the
 * same request can't double-send, while a genuinely later "resend"
 * request still goes through.
 */
export async function sendPasswordResetEmail(params: {
  email: string;
  actionLink: string;
}): Promise<EmailSendResult> {
  const minuteBucket = Math.floor(Date.now() / 60_000);
  const idempotencyKey = `password-reset-${params.email.trim().toLowerCase()}-${minuteBucket}`;
  const admin = getSupabaseAdminClient();

  try {
    const claim = await claimIdempotencyKey(admin, {
      emailType: "PASSWORD_RESET",
      idempotencyKey,
      recipientEmail: params.email,
    });

    if (!claim.claimed) {
      return { ok: true, skipped: true };
    }

    const { subject, html, text } = renderPasswordResetEmail({ actionLink: params.actionLink });
    const resend = getResendClient();

    const { data: sendResult, error } = await resend.emails.send(
      {
        from: getFromAddress(),
        to: params.email,
        replyTo: getReplyToAddress(),
        subject,
        html,
        text,
      },
      { idempotencyKey },
    );

    if (error) {
      await markLogResult(admin, claim.logId, { status: "FAILED", errorMessage: error.message });
      console.error("[Email Service] Password reset email failed:", error.message);
      return { ok: false, error: error.message };
    }

    await markLogResult(admin, claim.logId, { status: "SENT", resendEmailId: sendResult?.id });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email service error.";
    console.error("[Email Service] Password reset email threw:", message);
    return { ok: false, error: message };
  }
}
