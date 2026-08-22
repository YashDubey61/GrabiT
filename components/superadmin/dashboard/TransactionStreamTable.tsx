"use client";

import type { TransactionStreamLog } from "@/lib/mock/superadmin";

interface TransactionStreamTableProps {
  logs: TransactionStreamLog[];
  onViewAllLogs?: () => void;
}

export function TransactionStreamTable({
  logs,
  onViewAllLogs,
}: TransactionStreamTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface-elevated/80 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border p-5">
        <h4 className="font-display text-caption font-bold uppercase tracking-widest text-foreground">
          Transaction Stream
        </h4>
        <button
          type="button"
          onClick={onViewAllLogs}
          className="font-display text-caption font-bold uppercase tracking-wider text-primary hover:underline"
        >
          View All Logs
        </button>
      </div>

      <div className="overflow-x-auto hide-scrollbar">
        <table className="w-full border-collapse text-left text-body-sm">
          <thead>
            <tr className="border-b border-border/40 bg-surface-sunken font-display text-[10px] font-bold uppercase tracking-widest text-faint">
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Campus</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {logs.map((tx) => (
              <tr key={tx.id} className="transition-colors hover:bg-surface-elevated/50">
                <td className="px-5 py-3.5 font-mono font-bold text-primary">
                  {tx.txCode}
                </td>
                <td className="px-5 py-3.5 font-display font-semibold text-foreground">
                  {tx.campusName}
                </td>
                <td className="px-5 py-3.5 font-display font-extrabold text-foreground">
                  ₹{tx.amount.toFixed(2)}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-wider ${
                      tx.status === "Settled"
                        ? "bg-success/20 text-success border border-success/30"
                        : "bg-primary/20 text-primary border border-primary/30"
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-mono text-caption text-faint">
                  {tx.timeText}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
