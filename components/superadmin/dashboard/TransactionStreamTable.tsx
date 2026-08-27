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
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-[#0c0c0e]/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36)]">
      {/* Top glare */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent opacity-60"
        aria-hidden="true"
      />

      <div className="flex items-center justify-between border-b border-white/[0.08] p-5">
        <h4 className="font-display text-caption font-extrabold uppercase tracking-wider text-white">
          Transaction Stream
        </h4>
        <button
          type="button"
          onClick={onViewAllLogs}
          className="font-display text-caption font-extrabold uppercase tracking-wider text-primary hover:underline cursor-pointer"
        >
          View All Logs
        </button>
      </div>

      <div className="overflow-x-auto hide-scrollbar">
        <table className="w-full border-collapse text-left text-body-sm">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.02] font-display text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Campus</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {logs.map((tx) => (
              <tr key={tx.id} className="transition-colors hover:bg-white/[0.03]">
                <td className="px-5 py-3.5 font-mono font-bold text-primary">
                  {tx.txCode}
                </td>
                <td className="px-5 py-3.5 font-display font-semibold text-white">
                  {tx.campusName}
                </td>
                <td className="px-5 py-3.5 font-display font-extrabold text-white font-mono">
                  ₹{tx.amount.toFixed(2)}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-display text-[9px] font-extrabold uppercase tracking-wider ${
                      tx.status === "Settled"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-primary/15 text-primary border border-primary/30"
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-mono text-caption text-zinc-400">
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
