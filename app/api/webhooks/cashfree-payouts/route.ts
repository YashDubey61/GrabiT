import { NextResponse } from "next/server";
import { verifyCashfreePayoutWebhookSignature } from "@/lib/payments/cashfree_payouts";
import { sendTelegramMessage, formatVendorPayoutCompletedTelegramMessage } from "@/lib/telegram/bot";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface CashfreePayoutWebhookPayload {
  event: string;
  data?: {
    transferId?: string;
    referenceId?: string;
    status?: "SUCCESS" | "FAILED" | "PENDING" | "REVERSED" | string;
    reason?: string;
  };
}

/**
 * Cashfree Payouts status webhook — completely separate from the PG
 * webhook at /api/payments/cashfree/webhook. Verifies signature, is
 * idempotent (payment_webhook_events reused with gateway='cashfree_payout'),
 * and only ever flips a settlement to PAID via the confirm_vendor_payout
 * RPC, which itself is idempotent per cashfree_payout_id.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");
  const timestamp = request.headers.get("x-webhook-timestamp");

  if (!signature || !timestamp || !verifyCashfreePayoutWebhookSignature(rawBody, timestamp, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: CashfreePayoutWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid webhook body." }, { status: 400 });
  }

  const transferId = payload.data?.transferId ?? "";
  const status = payload.data?.status;
  const eventId = `payout:${payload.event}:${transferId}:${status}`;

  const admin = getSupabaseAdminClient();

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
    event_type: payload.event,
    gateway: "cashfree",
    status: status ?? null,
    payload_summary: { transferId, status },
    processed_at: new Date().toISOString(),
  });

  if (!transferId || (status !== "SUCCESS" && status !== "FAILED")) {
    return NextResponse.json({ ok: true });
  }

  try {
    const { data: result } = await admin.rpc("confirm_vendor_payout", {
      p_cashfree_payout_id: transferId,
      p_status: status === "SUCCESS" ? "PAID" : "FAILED",
      p_failure_reason: status === "FAILED" ? (payload.data?.reason ?? "Cashfree reported FAILED.") : null,
    });

    const confirmResult = result as { settlementId: string; payoutStatus: string; alreadyProcessed: boolean } | null;

    // Telegram confirmation ONLY on a freshly-confirmed PAID — never on
    // FAILED/PROCESSING, and never twice for the same payout.
    if (confirmResult && confirmResult.payoutStatus === "PAID" && !confirmResult.alreadyProcessed) {
      const { data: settlement } = await admin
        .from("vendor_settlements")
        .select("settlement_date, payout_amount, canteens(name)")
        .eq("id", confirmResult.settlementId)
        .maybeSingle();

      if (settlement) {
        const now = new Date();
        const istOffsetMs = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(now.getTime() + istOffsetMs);
        const paidAtTimeStr = `${String(istNow.getUTCHours()).padStart(2, "0")}:${String(istNow.getUTCMinutes()).padStart(2, "0")} IST`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canteenName = (settlement.canteens as any)?.name ?? "Vendor";
        const text = formatVendorPayoutCompletedTelegramMessage({
          vendorName: canteenName,
          settlementDate: settlement.settlement_date,
          payoutAmount: Number(settlement.payout_amount ?? 0),
          cashfreeReference: transferId,
          paidAtTime: paidAtTimeStr,
        });
        await sendTelegramMessage(text);
      }
    }
  } catch (err) {
    console.error("Cashfree Payouts webhook processing error:", err);
  }

  return NextResponse.json({ ok: true });
}
