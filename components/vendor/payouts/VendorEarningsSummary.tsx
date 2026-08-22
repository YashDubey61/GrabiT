"use client";

import type { VendorFinanceData } from "@/lib/supabase/vendor_payouts";

export interface VendorEarningsSummaryProps {
  summary: VendorFinanceData["summary"];
  settlementSchedule: VendorFinanceData["settlementSchedule"];
}

export function VendorEarningsSummary({
  summary,
  settlementSchedule,
}: VendorEarningsSummaryProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-lg">
      <div className="border-b border-border/60 pb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Earnings & Deductions Formula
          </h3>
          <p className="text-caption text-muted">
            Transparent calculation breakdown of vendor earnings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 font-display text-caption font-bold text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>Settlement: {settlementSchedule.frequency}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-border/60 bg-background/50 p-3">
          <span className="text-caption text-faint block">Gross Sales</span>
          <span className="font-display text-title font-extrabold text-foreground">
            ₹{summary.grossSales.toFixed(2)}
          </span>
          <span className="text-[10px] text-faint block mt-0.5">({summary.completedOrdersCount} orders)</span>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/50 p-3">
          <span className="text-caption text-faint block">Cancellations</span>
          <span className="font-display text-title font-extrabold text-danger">
            -₹{summary.cancelledAmount.toFixed(2)}
          </span>
          <span className="text-[10px] text-faint block mt-0.5">({summary.cancelledOrdersCount} cancelled)</span>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/50 p-3">
          <span className="text-caption text-faint block">Discounts</span>
          <span className="font-display text-title font-extrabold text-purple-400">
            -₹{summary.discountsGiven.toFixed(2)}
          </span>
          <span className="text-[10px] text-faint block mt-0.5">(Customer coupons)</span>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/50 p-3">
          <span className="text-caption text-faint block">GRABIT Fee ({summary.commissionRate}%)</span>
          <span className="font-display text-title font-extrabold text-amber-400">
            -₹{summary.commissionAmount.toFixed(2)}
          </span>
          <span className="text-[10px] text-faint block mt-0.5">(Platform fee)</span>
        </div>

        <div className="rounded-xl border border-primary/40 bg-primary/10 p-3">
          <span className="text-caption font-bold text-primary block">Net Vendor Earnings</span>
          <span className="font-display text-title font-extrabold text-primary">
            ₹{summary.netEarnings.toFixed(2)}
          </span>
          <span className="text-[10px] text-primary/70 block mt-0.5">(Payable amount)</span>
        </div>
      </div>
    </div>
  );
}
