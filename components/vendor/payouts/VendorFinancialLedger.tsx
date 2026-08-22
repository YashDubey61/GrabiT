"use client";

import type { VendorLedgerTransaction } from "@/lib/supabase/vendor_payouts";

export interface VendorFinancialLedgerProps {
  transactions: VendorLedgerTransaction[];
}

export function VendorFinancialLedger({
  transactions,
}: VendorFinancialLedgerProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-lg">
      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Transaction Ledger
          </h3>
          <p className="text-caption text-muted">
            Order revenue credits, commission debits, discounts and reversals
          </p>
        </div>
        <span className="material-symbols-outlined text-primary text-[24px]">receipt_long</span>
      </div>

      {transactions.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-caption text-muted">
          No ledger transactions recorded in this period.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-3"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display text-body-sm font-bold text-foreground">
                    {tx.description}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 font-display text-[10px] font-extrabold uppercase ${
                      tx.type === "ORDER_REVENUE"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : tx.type === "COMMISSION"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-danger/10 text-danger border border-danger/30"
                    }`}
                  >
                    {tx.type.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="text-caption text-faint font-mono">
                  Ref: #{tx.reference} • {new Date(tx.dateIso).toLocaleString()}
                </span>
              </div>

              <div className="text-right font-display font-bold">
                <span className={tx.isCredit ? "text-emerald-400" : "text-amber-400"}>
                  {tx.isCredit ? `+₹${tx.amount.toFixed(2)}` : `-₹${tx.amount.toFixed(2)}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
