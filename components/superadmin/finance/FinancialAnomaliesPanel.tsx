"use client";

import Link from "next/link";
import type {
  FinancialAnomalyItem,
  ReconciliationItem,
} from "@/lib/supabase/superadmin_finance";

interface FinancialAnomaliesPanelProps {
  anomalies: FinancialAnomalyItem[];
  reconciliation: ReconciliationItem[];
}

export function FinancialAnomaliesPanel({
  anomalies,
  reconciliation,
}: FinancialAnomaliesPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Financial Anomalies Alerts */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons text-rose-400">warning</span>
            <h3 className="text-base font-bold text-white">Financial Anomalies & Signals</h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">{anomalies.length} active alerts</span>
        </div>

        {anomalies.length === 0 ? (
          <div className="py-8 text-center text-zinc-400 bg-zinc-950 rounded-xl border border-zinc-800/80">
            <span className="material-icons text-3xl text-emerald-500 mb-1">check_circle</span>
            <p className="text-xs font-semibold text-zinc-300">Financial Integrity Nominal</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">No negative balances or payout discrepancies detected.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((anom) => (
              <div
                key={anom.id}
                className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-start justify-between gap-4 hover:border-zinc-700 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800 uppercase">
                      {anom.severity}
                    </span>
                    <span className="text-xs font-bold text-zinc-200">{anom.entity}</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{anom.signal}</p>
                </div>

                <Link
                  href={anom.investigationLink}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  Investigate
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Financial Reconciliation Ledger Comparison */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-icons text-blue-400">balance</span>
          <h3 className="text-base font-bold text-white">Platform Financial Reconciliation Matrix</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
                <th className="py-2.5 px-3">Item Domain</th>
                <th className="py-2.5 px-3">Canteen / Campus</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Discrepancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {reconciliation.map((rec) => (
                <tr key={rec.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-orange-400">{rec.itemType}</td>
                  <td className="py-2.5 px-3 text-zinc-300">{rec.canteenName || rec.campusName || "Platform Wide"}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                        rec.status === "MATCHED"
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                          : "bg-amber-950/80 text-amber-300 border-amber-800"
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-200">
                    ₹{rec.discrepancyAmount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
