import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getISTSettlementWindow,
  calculateVendorSettlement,
} from "@/lib/telegram/settlement_calculator";
import {
  sendTelegramMessage,
  formatSettlementTelegramMessage,
} from "@/lib/telegram/bot";

export async function GET(req: Request) {
  return handleCronSettlement(req);
}

export async function POST(req: Request) {
  return handleCronSettlement(req);
}

async function handleCronSettlement(req: Request) {
  try {
    // 1. Authorization check for Cron execution
    const authHeader = req.headers.get("authorization");
    const cronSecretEnv = process.env.CRON_SECRET;
    const { searchParams } = new URL(req.url);
    const secretParam = searchParams.get("secret");

    if (cronSecretEnv && cronSecretEnv.trim() !== "") {
      const isAuthorized =
        authHeader === `Bearer ${cronSecretEnv}` || secretParam === cronSecretEnv;
      if (!isAuthorized) {
        return NextResponse.json(
          { error: "Unauthorized cron execution request." },
          { status: 401 },
        );
      }
    }

    const supabase = await createClient();

    // 2. Determine 6 PM IST settlement window
    const window = getISTSettlementWindow();

    // 3. Fetch all active canteens
    const { data: canteens, error: canteenErr } = await supabase
      .from("canteens")
      .select("id, name, email");

    if (canteenErr || !canteens || canteens.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No active canteens found for settlement." },
        { status: 404 },
      );
    }

    const results = [];
    let telegramSentCount = 0;

    // 4. Process settlement for each vendor
    for (const canteen of canteens) {
      const calc = await calculateVendorSettlement(
        canteen.id,
        canteen.name,
        window,
      );

      // Check existing settlement record
      const { data: existingRecord } = await supabase
        .from("vendor_settlements")
        .select(
          "id, status, already_paid_amount, telegram_delivery_status, telegram_sending_at, telegram_message_id",
        )
        .eq("canteen_id", canteen.id)
        .eq("settlement_date", calc.settlementDateStr)
        .eq("window_end", calc.windowEndIso)
        .maybeSingle();

      const currentStatus = existingRecord?.status || "PENDING";
      const alreadyPaid = existingRecord
        ? Number(existingRecord.already_paid_amount || 0)
        : 0.0;
      const payoutDue = Math.max(0, Math.round((calc.vendorPayout - alreadyPaid) * 100) / 100);

      // Upsert settlement record in public.vendor_settlements (does NOT overwrite telegram_delivery_status if SENT)
      const { data: upsertData, error: upsertErr } = await supabase
        .from("vendor_settlements")
        .upsert(
          {
            canteen_id: canteen.id,
            settlement_date: calc.settlementDateStr,
            window_start: calc.windowStartIso,
            window_end: calc.windowEndIso,
            total_orders: calc.totalOrders,
            gross_revenue: calc.grossRevenue,
            commission_rate: calc.commissionPerOrder,
            commission_amount: calc.commissionAmount,
            payout_amount: calc.vendorPayout,
            already_paid_amount: alreadyPaid,
            payout_due: payoutDue,
            cancelled_orders_count: calc.cancelledOrdersCount,
            cancelled_orders_amount: calc.cancelledOrdersAmount,
            status: currentStatus,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "canteen_id,settlement_date,window_end" },
        )
        .select("id, telegram_delivery_status, telegram_sending_at, telegram_message_id")
        .single();

      if (upsertErr) {
        console.error(`[Cron Settlement] Upsert failed for vendor ${canteen.name}:`, upsertErr);
      }

      // Vendor daily revenue email — reads the exact same `calc` object
      // already computed above and sent to Telegram (single source of
      // truth). Independent of the Telegram delivery lock below: email
      // has its own idempotency key (canteenId + settlementDateStr +
      // windowEndIso) inside sendVendorDailyRevenueEmail, so it's safe
      // to attempt on every cron run and is skipped once already sent.
      if (canteen.email) {
        try {
          const { sendVendorDailyRevenueEmail } = await import("@/lib/email/email-service");
          await sendVendorDailyRevenueEmail({
            vendorEmail: canteen.email,
            calc,
            alreadyPaidAmount: alreadyPaid,
            payoutDue,
            status: currentStatus as "PENDING" | "PAID" | "PARTIALLY_PAID",
          });
        } catch (emailErr) {
          console.warn(`Non-critical vendor daily revenue email error for ${canteen.name}:`, emailErr);
        }
      }

      const settlementRecordId = upsertData?.id || existingRecord?.id;
      const deliveryStatus = upsertData?.telegram_delivery_status || existingRecord?.telegram_delivery_status || "CALCULATED";
      const sendingAt = upsertData?.telegram_sending_at || existingRecord?.telegram_sending_at;

      // -------------------------------------------------------------
      // Delivery State Machine Guard
      // -------------------------------------------------------------

      // Rule A: If already SENT, NEVER resend Telegram message!
      if (deliveryStatus === "SENT") {
        results.push({
          canteenId: canteen.id,
          canteenName: canteen.name,
          totalOrders: calc.totalOrders,
          grossRevenue: calc.grossRevenue,
          payoutDue,
          telegramSent: false,
          reason: "already_sent",
          messageId: upsertData?.telegram_message_id || existingRecord?.telegram_message_id,
        });
        continue;
      }

      // Rule B: If status is SENDING, check for stale lock (> 5 minutes old)
      if (deliveryStatus === "SENDING" && sendingAt) {
        const sendingTime = new Date(sendingAt).getTime();
        const nowTime = new Date().getTime();
        const lockAgeMinutes = (nowTime - sendingTime) / (1000 * 60);

        if (lockAgeMinutes < 5) {
          // Lock active in another concurrent cron process -> skip
          results.push({
            canteenId: canteen.id,
            canteenName: canteen.name,
            totalOrders: calc.totalOrders,
            grossRevenue: calc.grossRevenue,
            payoutDue,
            telegramSent: false,
            reason: "locked_in_progress",
          });
          continue;
        }
      }

      // Rule C: Claim delivery lock -> Transition to SENDING atomically
      if (settlementRecordId) {
        await supabase
          .from("vendor_settlements")
          .update({
            telegram_delivery_status: "SENDING",
            telegram_sending_at: new Date().toISOString(),
          })
          .eq("id", settlementRecordId);
      }

      // Format & send Telegram notification per vendor
      const msgText = formatSettlementTelegramMessage({
        vendorName: canteen.name,
        settlementDate: calc.displayDate,
        windowLabel: calc.windowLabel,
        totalOrders: calc.totalOrders,
        grossRevenue: calc.grossRevenue,
        commissionAmount: calc.commissionAmount,
        vendorPayout: calc.vendorPayout,
        alreadyPaid: alreadyPaid,
        payoutDue: payoutDue,
        cancelledOrdersCount: calc.cancelledOrdersCount,
        cancelledOrdersAmount: calc.cancelledOrdersAmount,
        status: currentStatus as "PENDING" | "PAID" | "PARTIALLY_PAID",
      });

      const telegramRes = await sendTelegramMessage(msgText);

      if (telegramRes.ok && settlementRecordId) {
        telegramSentCount++;
        await supabase
          .from("vendor_settlements")
          .update({
            telegram_delivery_status: "SENT",
            telegram_message_id: telegramRes.messageId || null,
            telegram_sent_at: new Date().toISOString(),
            telegram_error: null,
          })
          .eq("id", settlementRecordId);
      } else if (settlementRecordId) {
        await supabase
          .from("vendor_settlements")
          .update({
            telegram_delivery_status: "FAILED",
            telegram_error: telegramRes.error || "Failed to send message",
          })
          .eq("id", settlementRecordId);
      }

      results.push({
        canteenId: canteen.id,
        canteenName: canteen.name,
        totalOrders: calc.totalOrders,
        grossRevenue: calc.grossRevenue,
        commissionAmount: calc.commissionAmount,
        vendorPayout: calc.vendorPayout,
        payoutDue,
        telegramSent: telegramRes.ok,
        telegramError: telegramRes.error,
      });
    }

    return NextResponse.json({
      ok: true,
      settlementDate: window.settlementDateStr,
      displayDate: window.displayDate,
      windowStart: window.windowStartIso,
      windowEnd: window.windowEndIso,
      totalVendorsProcessed: canteens.length,
      telegramSentCount,
      settlements: results,
    });
  } catch (err) {
    console.error("[Cron Settlement] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error running daily settlements." },
      { status: 500 },
    );
  }
}
