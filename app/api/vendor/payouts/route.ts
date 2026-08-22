import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { COMMISSION_PER_ORDER_INR } from "@/lib/telegram/settlement_calculator";
import type {
  VendorFinanceData,
  VendorSettlementItem,
  VendorPayoutRecord,
  VendorLedgerTransaction,
  VendorBankAccount,
} from "@/lib/supabase/vendor_payouts";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") ?? "7d";
    const customStart = searchParams.get("startDate");
    const customEnd = searchParams.get("endDate");

    // 1. Authenticate Vendor Context Server-Side
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Please sign in with a vendor account." },
        { status: 401 },
      );
    }
    const canteenId = vendorCtx.canteenId;
    const supabase = getSupabaseAdminClient();

    // 2. Date Range Boundaries
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let dateRangeLabel = "Last 7 Days";

    if (timeframe === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      dateRangeLabel = "Today";
    } else if (timeframe === "yesterday") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
      dateRangeLabel = "Yesterday";
    } else if (timeframe === "30d") {
      startDate = new Date(now.getTime() - 30 * 86400000);
      dateRangeLabel = "Last 30 Days";
    } else if (timeframe === "this_month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      dateRangeLabel = "This Month";
    } else if (timeframe === "custom" && customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      dateRangeLabel = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    } else {
      startDate = new Date(now.getTime() - 7 * 86400000);
      dateRangeLabel = "Last 7 Days";
    }

    // 3. Fetch Orders in Date Range for Revenue & Deductions
    const { data: primaryOrders } = await supabase
      .from("orders")
      .select("id, order_number, total_amount, promo_discount, status, created_at")
      .eq("canteen_id", canteenId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    const orders = primaryOrders ?? [];

    const validOrders = orders.filter((o) => o.status !== "cancelled" && o.status !== "rejected");
    const cancelledOrders = orders.filter((o) => o.status === "cancelled" || o.status === "rejected");

    const grossSales = validOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const cancelledAmount = cancelledOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const discountsGiven = validOrders.reduce((sum, o) => sum + Number(o.promo_discount || 0), 0);

    // GRABIT commission = ₹1 flat per eligible order — never a percentage of revenue.
    const commissionAmount = Number((validOrders.length * COMMISSION_PER_ORDER_INR).toFixed(2));
    const netEarnings = Math.max(0, Number((grossSales - discountsGiven - commissionAmount).toFixed(2)));

    // 4. Fetch Settlements (`vendor_settlements`)
    const { data: dbSettlements } = await supabase
      .from("vendor_settlements")
      .select("*")
      .eq("canteen_id", canteenId)
      .order("settlement_date", { ascending: false });

    const settlementsList = dbSettlements ?? [];
    let pendingSettlementAmount = 0;
    let paidOutAmount = 0;

    const settlements: VendorSettlementItem[] = settlementsList.map((s) => {
      const gRev = Number(s.gross_revenue || 0);
      const cAmt = Number(s.commission_amount || 0);
      const pAmt = Number(s.payout_amount || 0);
      const pDue = Number(s.payout_due || 0);
      const paidAmt = Number(s.already_paid_amount || 0);

      if (s.status === "PENDING") {
        pendingSettlementAmount += pDue > 0 ? pDue : pAmt;
      } else if (s.status === "PAID") {
        paidOutAmount += paidAmt > 0 ? paidAmt : pAmt;
      }

      return {
        id: s.id,
        settlementDateStr: s.settlement_date,
        windowStartIso: s.window_start,
        windowEndIso: s.window_end,
        totalOrders: s.total_orders,
        grossRevenue: gRev,
        commissionRate: Number(s.commission_rate ?? COMMISSION_PER_ORDER_INR),
        commissionAmount: cAmt,
        payoutAmount: pAmt,
        alreadyPaidAmount: paidAmt,
        payoutDue: pDue,
        status: s.status as VendorSettlementItem["status"],
        paymentReference: s.payment_reference || undefined,
        paidAtIso: s.paid_at || undefined,
      };
    });

    // 5. Fetch Payout Records (`payouts`)
    const { data: dbPayouts } = await supabase
      .from("payouts")
      .select("*")
      .eq("canteen_id", canteenId)
      .order("requested_at", { ascending: false });

    const payouts: VendorPayoutRecord[] = (dbPayouts ?? []).map((p) => ({
      id: p.id,
      referenceId: `PAY-${p.id.slice(0, 8).toUpperCase()}`,
      amount: Number(p.amount),
      status: p.status as VendorPayoutRecord["status"],
      paymentMethod: "Bank Transfer (Cashfree)",
      requestedAtIso: p.requested_at,
      settledAtIso: p.settled_at || undefined,
    }));

    // 6. Generate Transaction Ledger
    const transactions: VendorLedgerTransaction[] = [];
    for (const o of orders.slice(0, 30)) {
      const isCancelled = o.status === "cancelled" || o.status === "rejected";
      const orderRev = Number(o.total_amount || 0);

      if (!isCancelled) {
        transactions.push({
          id: `tx_rev_${o.id}`,
          dateIso: o.created_at,
          description: `Order #${o.order_number} Gross Revenue`,
          reference: o.order_number,
          type: "ORDER_REVENUE",
          isCredit: true,
          amount: orderRev,
          orderId: o.id,
        });

        const comm = COMMISSION_PER_ORDER_INR;
        if (comm > 0) {
          transactions.push({
            id: `tx_comm_${o.id}`,
            dateIso: o.created_at,
            description: `GRABIT Platform Commission (₹1/order) - Order #${o.order_number}`,
            reference: o.order_number,
            type: "COMMISSION",
            isCredit: false,
            amount: comm,
            orderId: o.id,
          });
        }
      } else {
        transactions.push({
          id: `tx_ref_${o.id}`,
          dateIso: o.created_at,
          description: `Cancelled Order #${o.order_number} Reversal`,
          reference: o.order_number,
          type: "REFUND",
          isCredit: false,
          amount: orderRev,
          orderId: o.id,
        });
      }
    }

    // 7. Fetch Canteen Bank Account
    const { data: canteenInfo } = await supabase
      .from("canteens")
      .select("bank_account_holder, bank_name, bank_account_number, ifsc_code, payout_account_verified")
      .eq("id", canteenId)
      .single();

    let bankAccount: VendorBankAccount = {
      accountHolderName: "",
      bankName: "",
      maskedAccountNumber: "",
      ifscCode: "",
      isVerified: false,
      isConfigured: false,
    };

    if (canteenInfo && canteenInfo.bank_account_number) {
      const rawAcc = canteenInfo.bank_account_number.trim();
      const masked = rawAcc.length >= 4 ? `•••• •••• ${rawAcc.slice(-4)}` : "••••";
      bankAccount = {
        accountHolderName: canteenInfo.bank_account_holder || "Vendor Business",
        bankName: canteenInfo.bank_name || "HDFC Bank",
        maskedAccountNumber: masked,
        ifscCode: canteenInfo.ifsc_code || "",
        isVerified: Boolean(canteenInfo.payout_account_verified),
        isConfigured: true,
      };
    }

    // Next Settlement Schedule
    const tomorrow6PM = new Date(now);
    tomorrow6PM.setHours(18, 0, 0, 0);

    const data: VendorFinanceData = {
      timeframe,
      dateRangeLabel,
      summary: {
        grossSales,
        cancelledAmount,
        discountsGiven,
        commissionAmount,
        commissionRate: COMMISSION_PER_ORDER_INR,
        netEarnings,
        pendingSettlementAmount,
        paidOutAmount,
        completedOrdersCount: validOrders.length,
        cancelledOrdersCount: cancelledOrders.length,
      },
      settlements,
      payouts,
      transactions,
      bankAccount,
      settlementSchedule: {
        frequency: "Daily at 6:00 PM IST",
        nextSettlementDateStr: tomorrow6PM.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        minimumThreshold: 100,
      },
    };

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("Vendor payouts GET error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 },
    );
  }
}
