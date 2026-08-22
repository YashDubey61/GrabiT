"use client";

import { useState } from "react";
import type { VendorPayoutRecord } from "@/lib/supabase/vendor_payouts";

export interface VendorPayoutHistoryTableProps {
  payouts: VendorPayoutRecord[];
}

export function VendorPayoutHistoryTable({
  payouts,
}: VendorPayoutHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPayouts = payouts.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || p.referenceId.toLowerCase().includes(q) || p.status.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Payout History
          </h3>
          <p className="text-caption text-muted">
            Transferred payouts via Cashfree Bank Transfer
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-faint">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference ID..."
            className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {filteredPayouts.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-caption text-muted">
          No payout records found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-border/60 font-display text-caption font-bold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Reference ID</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredPayouts.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-background/40">
                  <td className="py-3 px-3 font-display font-bold text-foreground">
                    {new Date(p.requestedAtIso).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-primary">
                    {p.referenceId}
                  </td>
                  <td className="py-3 px-3 text-caption text-muted">
                    {p.paymentMethod}
                  </td>
                  <td className="py-3 px-3 text-right font-display font-extrabold text-emerald-400">
                    ₹{p.amount.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-wider ${
                        p.status === "settled"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : p.status === "processing"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {p.status}
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
