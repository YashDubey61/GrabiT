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

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const canteenIdParam = searchParams.get("canteen_id");
    const statusParam = searchParams.get("status");

    let query = supabase
      .from("vendor_settlements")
      .select(
        `
        id,
        canteen_id,
        settlement_date,
        window_start,
        window_end,
        total_orders,
        gross_revenue,
        commission_rate,
        commission_amount,
        payout_amount,
        already_paid_amount,
        payout_due,
        cancelled_orders_count,
        cancelled_orders_amount,
        telegram_message_id,
        telegram_sent_at,
        status,
        payment_reference,
        paid_at,
        created_at,
        canteens:canteen_id ( name )
      `,
      )
      .order("settlement_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (dateParam) {
      query = query.eq("settlement_date", dateParam);
    }
    if (canteenIdParam && canteenIdParam !== "ALL") {
      query = query.eq("canteen_id", canteenIdParam);
    }
    if (statusParam && statusParam !== "ALL") {
      query = query.eq("status", statusParam);
    }

    const { data: settlements, error } = await query;

    if (error) {
      console.error("[SuperAdmin Settlements GET] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch active canteens for filter dropdown
    const { data: canteens } = await supabase.from("canteens").select("id, name");

    return NextResponse.json({
      ok: true,
      settlements: settlements || [],
      canteens: canteens || [],
    });
  } catch (err) {
    console.error("[SuperAdmin Settlements GET] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const body = await req.json().catch(() => ({}));
    const targetDateStr = body.date; // e.g. "2026-08-19"
    const refDate = targetDateStr ? new Date(targetDateStr) : new Date();

    const window = getISTSettlementWindow(refDate);

    const { data: canteens } = await supabase.from("canteens").select("id, name, email");
    if (!canteens || canteens.length === 0) {
      return NextResponse.json({ error: "No canteens found" }, { status: 404 });
    }

    const results = [];
    let telegramSentCount = 0;

    for (const canteen of canteens) {
      const calc = await calculateVendorSettlement(canteen.id, canteen.name, window);

      const { data: existingRecord } = await supabase
        .from("vendor_settlements")
        .select("id, status, already_paid_amount")
        .eq("canteen_id", canteen.id)
        .eq("settlement_date", calc.settlementDateStr)
        .eq("window_end", calc.windowEndIso)
        .maybeSingle();

      const currentStatus = existingRecord?.status || "PENDING";
      const alreadyPaid = existingRecord
        ? Number(existingRecord.already_paid_amount || 0)
        : 0.0;
      const payoutDue = Math.max(0, Math.round((calc.vendorPayout - alreadyPaid) * 100) / 100);

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
        .select("id")
        .single();

      if (upsertErr) {
        console.error(`[SuperAdmin Generate] Upsert failed for ${canteen.name}:`, upsertErr);
      }

      // Vendor daily revenue email — same `calc` used for Telegram
      // below and for the settlement record above; own idempotency key
      // means re-running a manual generate for the same date is safe.
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

      if (body.sendTelegram !== false) {
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
              telegram_message_id: telegramRes.messageId || null,
              telegram_sent_at: new Date().toISOString(),
            })
            .eq("id", settlementRecordId);
        }
      }

      results.push({
        canteenId: canteen.id,
        canteenName: canteen.name,
        totalOrders: calc.totalOrders,
        grossRevenue: calc.grossRevenue,
        commissionAmount: calc.commissionAmount,
        vendorPayout: calc.vendorPayout,
        payoutDue,
      });
    }

    return NextResponse.json({
      ok: true,
      settlementDate: window.settlementDateStr,
      displayDate: window.displayDate,
      telegramSentCount,
      settlements: results,
    });
  } catch (err) {
    console.error("[SuperAdmin Settlements POST] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
