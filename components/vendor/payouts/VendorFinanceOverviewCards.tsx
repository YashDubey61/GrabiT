"use client";

import type { VendorFinanceData } from "@/lib/supabase/vendor_payouts";

export interface VendorFinanceOverviewCardsProps {
  summary: VendorFinanceData["summary"];
}

export function VendorFinanceOverviewCards({
  summary,
}: VendorFinanceOverviewCardsProps) {
  const cards = [
    {
      title: "Gross Sales",
      value: `₹${summary.grossSales.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: "payments",
      color: "text-emerald-400 bg-emerald-500/10",
    },
    {
      title: "Customer Discounts",
      value: `-₹${summary.discountsGiven.toFixed(2)}`,
      icon: "local_offer",
      color: "text-purple-400 bg-purple-500/10",
    },
    {
      title: `GRABIT Fee (${summary.commissionRate}%)`,
      value: `-₹${summary.commissionAmount.toFixed(2)}`,
      icon: "receipt_long",
      color: "text-amber-400 bg-amber-500/10",
    },
    {
      title: "Net Earnings",
      value: `₹${summary.netEarnings.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: "account_balance_wallet",
      color: "text-primary bg-primary/10",
    },
    {
      title: "Pending Settlement",
      value: `₹${summary.pendingSettlementAmount.toFixed(2)}`,
      icon: "schedule",
      color: "text-blue-400 bg-blue-500/10",
    },
    {
      title: "Paid Out",
      value: `₹${summary.paidOutAmount.toFixed(2)}`,
      icon: "check_circle",
      color: "text-emerald-400 bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4 mb-6">
      {cards.map((c) => (
        <div
          key={c.title}
          className="flex flex-col justify-between rounded-2xl border border-border bg-surface-elevated p-4 backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-caption font-bold text-muted">
              {c.title}
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${c.color}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {c.icon}
              </span>
            </div>
          </div>

          <span className="mt-2 font-display text-title font-extrabold tracking-tight text-foreground sm:text-headline">
            {c.value}
          </span>
        </div>
      ))}
    </div>
  );
}
