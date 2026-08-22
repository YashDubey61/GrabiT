/**
 * Telegram Bot Integration Library — GRABIT Super Admin System
 * Handles daily vendor settlement notification delivery via Telegram Bot API
 * with automatic retries, error handling, and structured formatting.
 */

export interface TelegramMessageResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export interface SettlementTelegramPayload {
  vendorName: string;
  settlementDate: string; // e.g. "19 Aug 2026"
  windowLabel: string; // e.g. "8:00 AM – 6:00 PM"
  totalOrders: number;
  grossRevenue: number;
  commissionAmount: number;
  vendorPayout: number;
  alreadyPaid: number;
  payoutDue: number;
  cancelledOrdersCount?: number;
  cancelledOrdersAmount?: number;
  status: "PENDING" | "PAID" | "PARTIALLY_PAID";
}

export interface PaymentCompletedTelegramPayload {
  vendorName: string;
  settlementDate: string;
  paidAmount: number;
  paymentReference: string;
  paidAtTime: string; // e.g. "19:15 IST"
}

/**
 * Send a text message to the configured Telegram chat/user using Telegram Bot API.
 * Never exposes TELEGRAM_BOT_TOKEN to client code.
 */
export async function sendTelegramMessage(
  text: string,
  targetChatId?: string,
  maxRetries = 3,
): Promise<TelegramMessageResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = targetChatId || process.env.TELEGRAM_SUPERADMIN_CHAT_ID;

  if (!token || !token.trim()) {
    console.warn("[Telegram Bot] TELEGRAM_BOT_TOKEN is missing in environment variables.");
    return {
      ok: false,
      error: "TELEGRAM_BOT_TOKEN is not configured in server environment.",
    };
  }

  if (!chatId || !chatId.trim()) {
    console.warn("[Telegram Bot] TELEGRAM_SUPERADMIN_CHAT_ID is missing in environment variables.");
    return {
      ok: false,
      error: "TELEGRAM_SUPERADMIN_CHAT_ID is not configured in server environment.",
    };
  }

  const url = `https://api.telegram.org/bot${token.trim()}/sendMessage`;
  const body = {
    chat_id: chatId.trim(),
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  let lastError = "";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        return {
          ok: true,
          messageId: String(data.result?.message_id ?? ""),
        };
      }

      lastError = data.description || `HTTP ${res.status} ${res.statusText}`;
      console.warn(
        `[Telegram Bot] Attempt ${attempt}/${maxRetries} failed: ${lastError}`,
      );
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[Telegram Bot] Attempt ${attempt}/${maxRetries} network error: ${lastError}`);
    }

    if (attempt < maxRetries) {
      const delayMs = attempt * 500;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return {
    ok: false,
    error: `Failed to send Telegram notification after ${maxRetries} attempts: ${lastError}`,
  };
}

/**
 * Format standard daily vendor settlement report for Telegram delivery.
 */
export function formatSettlementTelegramMessage(
  payload: SettlementTelegramPayload,
): string {
  const formattedGross = payload.grossRevenue.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  const formattedCommission = payload.commissionAmount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  const formattedPayout = payload.vendorPayout.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  const formattedAlreadyPaid = payload.alreadyPaid.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  const formattedPayoutDue = payload.payoutDue.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  const statusLabel =
    payload.status === "PAID"
      ? "PAYMENT COMPLETED"
      : payload.status === "PARTIALLY_PAID"
        ? "PARTIALLY PAID"
        : "PAYMENT PENDING";

  let msg = `<b>GRABIT DAILY VENDOR SETTLEMENT</b>\n`;
  msg += `Date: <b>${payload.settlementDate}</b>\n`;
  msg += `Settlement Cycle: <b>Previous 6:00 PM → Today 6:00 PM IST</b>\n\n`;
  msg += `Breakdown:\n`;
  msg += `• Overnight Carry-Forward: 6:00 PM → 8:00 AM\n`;
  msg += `• Today’s Orders: 8:00 AM → 6:00 PM\n\n`;
  msg += `Vendor: <b>${escapeHtml(payload.vendorName)}</b>\n\n`;
  msg += `Orders: <b>${payload.totalOrders}</b>\n`;
  msg += `Gross Revenue: <b>₹${formattedGross}</b>\n`;
  msg += `GRABIT Commission: <b>₹1/order × ${payload.totalOrders} = ₹${formattedCommission}</b>\n`;
  msg += `Vendor Payout: <b>₹${formattedPayout}</b>\n`;
  msg += `Already Paid: ₹${formattedAlreadyPaid}\n`;
  msg += `Payout Due: <b>₹${formattedPayoutDue}</b>\n`;

  if (payload.cancelledOrdersCount && payload.cancelledOrdersCount > 0) {
    const formattedCancelled = (payload.cancelledOrdersAmount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
    msg += `Cancelled/Refunded: ${payload.cancelledOrdersCount} orders (₹${formattedCancelled})\n`;
  }

  msg += `\nStatus: <b>${statusLabel}</b>`;

  return msg;
}

/**
 * Format payment completion message when Super Admin marks a settlement as paid.
 */
export function formatPaymentCompletedTelegramMessage(
  payload: PaymentCompletedTelegramPayload,
): string {
  const formattedPaid = payload.paidAmount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

  let msg = `<b>GRABIT SETTLEMENT PAYMENT COMPLETED</b>\n`;
  msg += `Date: <b>${payload.settlementDate}</b>\n`;
  msg += `Vendor: <b>${escapeHtml(payload.vendorName)}</b>\n\n`;
  msg += `Paid Amount: <b>₹${formattedPaid}</b>\n`;
  msg += `Payment Reference: <code>${escapeHtml(payload.paymentReference)}</code>\n`;
  msg += `Paid At: <b>${payload.paidAtTime}</b>\n\n`;
  msg += `Status: <b>PAID</b>`;

  return msg;
}

export interface VendorPayoutCompletedTelegramPayload {
  vendorName: string;
  settlementDate: string;
  payoutAmount: number;
  cashfreeReference: string;
  paidAtTime: string;
}

/** Sent only after a Cashfree Payouts transfer is verified PAID — never
 * for PROCESSING. Distinct from formatPaymentCompletedTelegramMessage
 * (the existing manual bank-transfer confirmation), which stays
 * unchanged and keeps firing for the manual pay flow. */
export function formatVendorPayoutCompletedTelegramMessage(
  payload: VendorPayoutCompletedTelegramPayload,
): string {
  const formattedAmount = payload.payoutAmount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

  let msg = `<b>GRABIT VENDOR PAYMENT COMPLETED</b>\n`;
  msg += `Vendor: <b>${escapeHtml(payload.vendorName)}</b>\n`;
  msg += `Settlement: <b>${payload.settlementDate}</b>\n\n`;
  msg += `Payout Amount: <b>₹${formattedAmount}</b>\n`;
  msg += `Payout Status: <b>PAID</b>\n`;
  msg += `Cashfree Reference: <code>${escapeHtml(payload.cashfreeReference)}</code>\n`;
  msg += `Paid At: <b>${payload.paidAtTime}</b>`;

  return msg;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
