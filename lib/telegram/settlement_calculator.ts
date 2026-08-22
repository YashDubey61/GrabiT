import { createClient } from "@/lib/supabase/server";

/**
 * Single source of truth for GRABIT's platform commission: a flat ₹1
 * per eligible (completed/picked-up) order — never a percentage of
 * revenue. Every settlement calculation and the Telegram notification
 * must derive from this constant, not a separate hardcoded rate.
 */
export const COMMISSION_PER_ORDER_INR = 1;

export interface ISTSettlementWindow {
  settlementDateStr: string; // YYYY-MM-DD in IST
  displayDate: string; // e.g. "19 Aug 2026"
  windowLabel: string; // e.g. "8:00 AM – 6:00 PM"
  windowStartIso: string; // UTC ISO string for Yesterday 18:00 IST
  windowEndIso: string; // UTC ISO string for Today 18:00 IST
}

export interface CalculatedVendorSettlement {
  canteenId: string;
  canteenName: string;
  settlementDateStr: string;
  displayDate: string;
  windowLabel: string;
  windowStartIso: string;
  windowEndIso: string;
  totalOrders: number;
  grossRevenue: number;
  /** Flat ₹ commission charged per eligible order (see COMMISSION_PER_ORDER_INR) — not a percentage. */
  commissionPerOrder: number;
  commissionAmount: number;
  vendorPayout: number;
  alreadyPaidAmount: number;
  payoutDue: number;
  cancelledOrdersCount: number;
  cancelledOrdersAmount: number;
}

/**
 * Calculates the exact 6 PM IST settlement window for a given date.
 *Reporting window: 18:00 IST (Yesterday) to 18:00 IST (Today).
 * Includes carried-forward overnight orders (6 PM -> 8 AM) + today's 8 AM -> 6 PM orders.
 * Excludes orders created after 6 PM IST today (carried forward to next settlement).
 */
export function getISTSettlementWindow(referenceDate?: Date): ISTSettlementWindow {
  const now = referenceDate ? new Date(referenceDate) : new Date();

  // Convert reference date to IST time parts (Asia/Kolkata is UTC+5:30)
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffsetMs);

  const istYear = istNow.getUTCFullYear();
  const istMonth = istNow.getUTCMonth(); // 0-indexed
  const istDate = istNow.getUTCDate();
  const istHours = istNow.getUTCHours();

  // If current IST time is before 18:00 (6 PM), the active 6 PM cutoff is today's 18:00 IST.
  // Target date for settlement in IST
  let targetDate = new Date(Date.UTC(istYear, istMonth, istDate));

  // If calculating for current day before 18:00 IST in live trigger, target yesterday's 6 PM settlement
  if (!referenceDate && istHours < 18) {
    targetDate = new Date(Date.UTC(istYear, istMonth, istDate - 1));
  }

  const tYear = targetDate.getUTCFullYear();
  const tMonth = targetDate.getUTCMonth();
  const tDate = targetDate.getUTCDate();

  // 18:00 IST = 12:30 UTC of the same date
  const windowEndUtc = new Date(Date.UTC(tYear, tMonth, tDate, 12, 30, 0, 0));
  // Yesterday 18:00 IST = 24 hours before windowEndUtc
  const windowStartUtc = new Date(windowEndUtc.getTime() - 24 * 60 * 60 * 1000);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const settlementDateStr = `${tYear}-${pad(tMonth + 1)}-${pad(tDate)}`;

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const displayDate = `${tDate} ${months[tMonth]} ${tYear}`;

  return {
    settlementDateStr,
    displayDate,
    windowLabel: "Previous 6:00 PM → Today 6:00 PM IST",
    windowStartIso: windowStartUtc.toISOString(),
    windowEndIso: windowEndUtc.toISOString(),
  };
}

/**
 * Calculates a single vendor's settlement metrics from authoritative database order records.
 */
export async function calculateVendorSettlement(
  canteenId: string,
  canteenName: string,
  window: ISTSettlementWindow,
): Promise<CalculatedVendorSettlement> {
  const supabase = await createClient();

  // Fetch orders created within the settlement window for this canteen
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, status, total_amount, created_at")
    .eq("canteen_id", canteenId)
    .gte("created_at", window.windowStartIso)
    .lt("created_at", window.windowEndIso);

  if (error) {
    console.error(`[Settlement Calculator] Error fetching orders for ${canteenName}:`, error);
  }

  const allOrders = orders || [];

  // Filter completed/eligible orders
  const completedOrders = allOrders.filter(
    (o) => o.status === "completed" || o.status === "picked_up",
  );
  const cancelledOrders = allOrders.filter((o) => o.status === "cancelled");

  const totalOrders = completedOrders.length;

  const grossRevenueRaw = completedOrders.reduce(
    (acc, o) => acc + Number(o.total_amount || 0),
    0,
  );
  const grossRevenue = Math.round(grossRevenueRaw * 100) / 100;

  const cancelledOrdersCount = cancelledOrders.length;
  const cancelledOrdersAmountRaw = cancelledOrders.reduce(
    (acc, o) => acc + Number(o.total_amount || 0),
    0,
  );
  const cancelledOrdersAmount = Math.round(cancelledOrdersAmountRaw * 100) / 100;

  // GRABIT commission = ₹1 flat per eligible order — never a percentage of revenue.
  const commissionAmount = Math.round(totalOrders * COMMISSION_PER_ORDER_INR * 100) / 100;
  const vendorPayout = Math.round((grossRevenue - commissionAmount) * 100) / 100;

  // Check if any payout was already recorded for this window
  const { data: existingSettlement } = await supabase
    .from("vendor_settlements")
    .select("already_paid_amount")
    .eq("canteen_id", canteenId)
    .eq("settlement_date", window.settlementDateStr)
    .eq("window_end", window.windowEndIso)
    .maybeSingle();

  const alreadyPaidAmount = existingSettlement
    ? Number(existingSettlement.already_paid_amount || 0)
    : 0.0;

  const payoutDue = Math.max(0, Math.round((vendorPayout - alreadyPaidAmount) * 100) / 100);

  return {
    canteenId,
    canteenName,
    settlementDateStr: window.settlementDateStr,
    displayDate: window.displayDate,
    windowLabel: window.windowLabel,
    windowStartIso: window.windowStartIso,
    windowEndIso: window.windowEndIso,
    totalOrders,
    grossRevenue,
    commissionPerOrder: COMMISSION_PER_ORDER_INR,
    commissionAmount,
    vendorPayout,
    alreadyPaidAmount,
    payoutDue,
    cancelledOrdersCount,
    cancelledOrdersAmount,
  };
}
