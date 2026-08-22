import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendTelegramMessage,
  formatPaymentCompletedTelegramMessage,
} from "@/lib/telegram/bot";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Verify Super Admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin access required" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { settlementId, paidAmount, paymentReference } = body;

    if (!settlementId || typeof settlementId !== "string") {
      return NextResponse.json(
        { error: "settlementId is required" },
        { status: 400 },
      );
    }

    const numericPaidAmount = Number(paidAmount);
    if (isNaN(numericPaidAmount) || numericPaidAmount < 0) {
      return NextResponse.json(
        { error: "Valid paidAmount is required" },
        { status: 400 },
      );
    }

    const refStr = typeof paymentReference === "string" ? paymentReference.trim() : "";
    if (!refStr) {
      return NextResponse.json(
        { error: "Payment reference / transaction ID is required" },
        { status: 400 },
      );
    }

    // Fetch existing settlement record
    const { data: settlement, error: fetchErr } = await supabase
      .from("vendor_settlements")
      .select(
        `
        id,
        canteen_id,
        settlement_date,
        gross_revenue,
        payout_amount,
        already_paid_amount,
        payout_due,
        status,
        payment_reference,
        payment_telegram_sent,
        payment_telegram_message_id,
        canteens:canteen_id ( name )
      `,
      )
      .eq("id", settlementId)
      .single();

    if (fetchErr || !settlement) {
      return NextResponse.json(
        { error: "Settlement record not found" },
        { status: 404 },
      );
    }

    // Idempotency check: If already paid with same reference & Telegram sent -> skip duplicate send!
    if (
      settlement.status === "PAID" &&
      settlement.payment_reference === refStr &&
      settlement.payment_telegram_sent === true
    ) {
      return NextResponse.json({
        ok: true,
        settlementId,
        status: settlement.status,
        alreadyPaidAmount: Number(settlement.already_paid_amount),
        payoutDue: Number(settlement.payout_due),
        paymentReference: refStr,
        telegramSent: false,
        duplicateRequest: true,
        message: "Payment already processed and Telegram confirmation previously sent.",
      });
    }

    const vendorPayout = Number(settlement.payout_amount || 0);
    const currentAlreadyPaid = Number(settlement.already_paid_amount || 0);
    const newAlreadyPaid = Math.round((currentAlreadyPaid + numericPaidAmount) * 100) / 100;
    const newPayoutDue = Math.max(0, Math.round((vendorPayout - newAlreadyPaid) * 100) / 100);

    const newStatus = newPayoutDue <= 0 ? "PAID" : "PARTIALLY_PAID";
    const nowIso = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from("vendor_settlements")
      .update({
        status: newStatus,
        already_paid_amount: newAlreadyPaid,
        payout_due: newPayoutDue,
        payment_reference: refStr,
        paid_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", settlementId);

    if (updateErr) {
      console.error("[SuperAdmin Settlement Pay] Update error:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canteenData = settlement.canteens as any;
    const vendorName = canteenData?.name || "Vendor";

    // Send Telegram payment confirmation ONLY ONCE if not already sent for this settlement
    let telegramSent = false;

    if (!settlement.payment_telegram_sent) {
      const now = new Date();
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + istOffsetMs);
      const istHours = String(istNow.getUTCHours()).padStart(2, "0");
      const istMins = String(istNow.getUTCMinutes()).padStart(2, "0");
      const paidAtTimeStr = `${istHours}:${istMins} IST`;

      const telegramText = formatPaymentCompletedTelegramMessage({
        vendorName,
        settlementDate: settlement.settlement_date,
        paidAmount: numericPaidAmount,
        paymentReference: refStr,
        paidAtTime: paidAtTimeStr,
      });

      const telegramRes = await sendTelegramMessage(telegramText);

      if (telegramRes.ok) {
        telegramSent = true;
        await supabase
          .from("vendor_settlements")
          .update({
            payment_telegram_sent: true,
            payment_telegram_message_id: telegramRes.messageId || null,
          })
          .eq("id", settlementId);
      }
    }

    return NextResponse.json({
      ok: true,
      settlementId,
      status: newStatus,
      alreadyPaidAmount: newAlreadyPaid,
      payoutDue: newPayoutDue,
      paymentReference: refStr,
      telegramSent,
    });
  } catch (err) {
    console.error("[SuperAdmin Settlement Pay] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
