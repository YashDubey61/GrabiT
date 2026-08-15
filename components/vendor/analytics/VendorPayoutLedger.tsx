"use client";

import type { VendorPayoutRecord } from "@/lib/mock/vendor";

interface VendorPayoutLedgerProps {
  records: VendorPayoutRecord[];
  onDownloadHistory?: () => void;
}

export function VendorPayoutLedger({
  records,
  onDownloadHistory,
}: VendorPayoutLedgerProps) {
  const pendingTotal = records
    .filter((r) => r.status === "Pending")
    .reduce((sum, r) => sum + r.amount, 0);

  const settledTotal = records
    .filter((r) => r.status === "Settled")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-[#1e1f26]/80 backdrop-blur-md">
      {/* Header & Balance Summary */}
      <div className="flex flex-col gap-4 border-b border-border p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Payout Ledger
          </h3>
          <p className="text-body-sm text-faint">Last settlement: 2 hours ago</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="font-display text-caption font-bold uppercase tracking-wider text-faint">
              Pending
            </p>
            <p className="font-display text-heading font-extrabold text-primary">
              ₹{pendingTotal.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="h-8 w-[1px] bg-border" />

          <div className="text-right">
            <p className="font-display text-caption font-bold uppercase tracking-wider text-faint">
              Settled
            </p>
            <p className="font-display text-heading font-extrabold text-foreground">
              ₹{settledTotal.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto hide-scrollbar">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border/40 bg-surface-sunken font-display text-[10px] font-bold uppercase tracking-widest text-faint">
              <th className="px-6 py-3.5">Reference</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Date</th>
              <th className="px-6 py-3.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 font-body text-body-sm">
            {records.map((rec) => (
              <tr key={rec.id} className="transition-colors hover:bg-surface-elevated/50">
                <td className="px-6 py-4 font-mono font-bold text-foreground">
                  {rec.reference}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider ${
                      rec.status === "Pending"
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-success/20 text-success border border-success/30"
                    }`}
                  >
                    {rec.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-faint">{rec.date}</td>
                <td className="px-6 py-4 text-right font-display font-extrabold text-foreground">
                  ₹{rec.amount.toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Action */}
      <div className="flex justify-center border-t border-border/40 bg-surface-sunken/40 p-4">
        <button
          type="button"
          onClick={onDownloadHistory}
          className="flex items-center gap-2 font-display text-caption font-extrabold uppercase tracking-wider text-primary hover:text-primary-soft transition-colors"
        >
          <span>Download Full History</span>
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            download
          </span>
        </button>
      </div>
    </section>
  );
}
