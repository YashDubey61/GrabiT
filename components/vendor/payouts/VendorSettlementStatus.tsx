"use client";

import type { VendorSettlementItem } from "@/lib/supabase/vendor_payouts";

export interface VendorSettlementStatusProps {
  settlements: VendorSettlementItem[];
}

export function VendorSettlementStatus({
  settlements,
}: VendorSettlementStatusProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-lg">
      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Daily Settlement Cycles
          </h3>
          <p className="text-caption text-muted">
            Daily 6:00 PM IST settlement windows and calculated payout dues
          </p>
        </div>
        <span className="material-symbols-outlined text-blue-400 text-[24px]">account_balance</span>
      </div>

      {settlements.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-caption text-muted">
          No settlement cycles recorded in this date range.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-border/60 font-display text-caption font-bold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-center">Orders</th>
                <th className="py-2.5 px-3 text-right">Gross Sales</th>
                <th className="py-2.5 px-3 text-right">Fee (10%)</th>
                <th className="py-2.5 px-3 text-right">Net Payout</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {settlements.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-background/40">
                  {/* Date */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-display font-bold text-foreground">
                        {s.settlementDateStr}
                      </span>
                      <span className="text-[11px] text-faint font-mono">
                        Ref: {s.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </td>

                  {/* Orders */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-foreground">
                    {s.totalOrders}
                  </td>

                  {/* Gross */}
                  <td className="py-3 px-3 text-right font-display font-bold text-foreground">
                    ₹{s.grossRevenue.toFixed(2)}
                  </td>

                  {/* Fee */}
                  <td className="py-3 px-3 text-right font-display font-bold text-amber-400">
                    -₹{s.commissionAmount.toFixed(2)}
                  </td>

                  {/* Net Payout */}
                  <td className="py-3 px-3 text-right font-display font-extrabold text-emerald-400">
                    ₹{s.payoutAmount.toFixed(2)}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-wider ${
                        s.status === "PAID"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : s.status === "PARTIALLY_PAID"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
