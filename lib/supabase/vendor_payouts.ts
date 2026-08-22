export interface VendorSettlementItem {
  id: string;
  settlementDateStr: string;
  windowStartIso: string;
  windowEndIso: string;
  totalOrders: number;
  grossRevenue: number;
  commissionRate: number;
  commissionAmount: number;
  payoutAmount: number;
  alreadyPaidAmount: number;
  payoutDue: number;
  status: "PENDING" | "PAID" | "PARTIALLY_PAID" | "PROCESSING" | "FAILED" | "ON_HOLD";
  paymentReference?: string;
  paidAtIso?: string;
}

export interface VendorPayoutRecord {
  id: string;
  referenceId: string;
  amount: number;
  status: "settled" | "requested" | "processing" | "failed";
  paymentMethod: string; // Cashfree, Bank Transfer, UPI
  requestedAtIso: string;
  settledAtIso?: string;
}

export interface VendorLedgerTransaction {
  id: string;
  dateIso: string;
  description: string;
  reference: string;
  type: "ORDER_REVENUE" | "COMMISSION" | "DISCOUNT" | "REFUND" | "SETTLEMENT" | "PAYOUT";
  isCredit: boolean;
  amount: number;
  orderId?: string;
}

export interface VendorBankAccount {
  accountHolderName: string;
  bankName: string;
  maskedAccountNumber: string;
  ifscCode: string;
  isVerified: boolean;
  isConfigured: boolean;
}

export interface VendorFinanceData {
  timeframe: string;
  dateRangeLabel: string;
  summary: {
    grossSales: number;
    cancelledAmount: number;
    discountsGiven: number;
    commissionAmount: number;
    commissionRate: number; // flat ₹ commission per order (e.g. 1), not a percentage
    netEarnings: number;
    pendingSettlementAmount: number;
    paidOutAmount: number;
    completedOrdersCount: number;
    cancelledOrdersCount: number;
  };
  settlements: VendorSettlementItem[];
  payouts: VendorPayoutRecord[];
  transactions: VendorLedgerTransaction[];
  bankAccount: VendorBankAccount;
  settlementSchedule: {
    frequency: string; // "Daily at 6:00 PM IST"
    nextSettlementDateStr: string;
    minimumThreshold: number; // ₹100
  };
}

export async function getLiveVendorFinance(
  timeframe = "7d",
  startDate?: string,
  endDate?: string,
): Promise<{ ok: boolean; data?: VendorFinanceData; error?: string }> {
  try {
    const params = new URLSearchParams({ timeframe });
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const res = await fetch(`/api/vendor/payouts?${params.toString()}`, {
      headers: { "Cache-Control": "no-cache" },
    });
    const result = await res.json();
    if (!res.ok || !result.ok) {
      return { ok: false, error: result.error ?? "Failed to fetch financial data." };
    }
    return { ok: true, data: result.data };
  } catch (err) {
    console.error("Fetch vendor finance error:", err);
    return { ok: false, error: "Network error loading vendor financial data." };
  }
}

export async function saveVendorBankAccount(payload: {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/vendor/payouts/bank-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok || !result.ok) {
      return { ok: false, error: result.error ?? "Failed to update bank account." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error saving bank details." };
  }
}

export function exportVendorFinanceCsv(data: VendorFinanceData) {
  const lines: string[] = [];

  lines.push(`GRABIT Vendor Financial Statement - ${data.dateRangeLabel}`);
  lines.push(`Generated At,${new Date().toLocaleString()}`);
  lines.push("");

  lines.push("--- FINANCIAL SUMMARY ---");
  lines.push(`Gross Sales,₹${data.summary.grossSales.toFixed(2)}`);
  lines.push(`Cancelled Amount,-₹${data.summary.cancelledAmount.toFixed(2)}`);
  lines.push(`Discounts Given,-₹${data.summary.discountsGiven.toFixed(2)}`);
  lines.push(`GRABIT Commission (₹${data.summary.commissionRate}/order),-₹${data.summary.commissionAmount.toFixed(2)}`);
  lines.push(`Net Vendor Earnings,₹${data.summary.netEarnings.toFixed(2)}`);
  lines.push(`Pending Settlement,₹${data.summary.pendingSettlementAmount.toFixed(2)}`);
  lines.push(`Paid Out,₹${data.summary.paidOutAmount.toFixed(2)}`);
  lines.push("");

  lines.push("--- SETTLEMENT RECORDS ---");
  lines.push("Settlement ID,Date,Orders,Gross Revenue,Commission,Net Payout,Status");
  data.settlements.forEach((s) => {
    lines.push(
      `"${s.id.slice(0, 8)}","${s.settlementDateStr}",${s.totalOrders},${s.grossRevenue.toFixed(2)},${s.commissionAmount.toFixed(2)},${s.payoutAmount.toFixed(2)},"${s.status}"`,
    );
  });
  lines.push("");

  lines.push("--- TRANSACTION LEDGER ---");
  lines.push("Date,Type,Description,Reference,Amount (₹)");
  data.transactions.forEach((t) => {
    const sign = t.isCredit ? "+" : "-";
    lines.push(
      `"${new Date(t.dateIso).toLocaleString()}","${t.type}","${t.description}","${t.reference}",${sign}${t.amount.toFixed(2)}`,
    );
  });

  const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(lines.join("\n"));
  const link = document.createElement("a");
  link.setAttribute("href", csvContent);
  link.setAttribute(
    "download",
    `GRABIT_Finance_${data.timeframe}_${new Date().toISOString().slice(0, 10)}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
