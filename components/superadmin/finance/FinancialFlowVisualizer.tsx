"use client";

import type { FinancialFlowData } from "@/lib/supabase/superadmin_finance";

interface FinancialFlowVisualizerProps {
  flow: FinancialFlowData;
}

export function FinancialFlowVisualizer({ flow }: FinancialFlowVisualizerProps) {
  const steps = [
    { label: "Customer Payment", amount: flow.customerPayments, color: "text-blue-400 border-blue-800 bg-blue-950/40" },
    { label: "Gross GMV", amount: flow.grossOrderValue, color: "text-purple-400 border-purple-800 bg-purple-950/40" },
    { label: "Discounts & Promos", amount: -flow.discounts, color: "text-amber-400 border-amber-800 bg-amber-950/40" },
    { label: "Dispute Refunds", amount: -flow.refunds, color: "text-rose-400 border-rose-800 bg-rose-950/40" },
    { label: "Net Order Value", amount: flow.netOrderValue, color: "text-emerald-400 border-emerald-800 bg-emerald-950/40" },
    { label: `Platform Commission (${flow.configuredCommissionPct}%)`, amount: flow.grabitCommission, color: "text-orange-400 border-orange-800 bg-orange-950/40" },
    { label: "Vendor Net Earnings", amount: flow.vendorEarnings, color: "text-emerald-300 border-emerald-700 bg-emerald-950/60" },
    { label: "Settled Payouts", amount: flow.vendorPayouts, color: "text-purple-300 border-purple-700 bg-purple-950/60" },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-icons text-orange-400">account_tree</span>
          <h3 className="text-base font-bold text-white">Platform Financial Flow Pipeline</h3>
        </div>
        <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
          Commission Source: {flow.configuredCommissionPct}% Configured Rate
        </span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex items-center gap-3 min-w-max">
          {steps.map((st, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={`p-3.5 rounded-xl border ${st.color} space-y-1 min-w-[140px] text-center shadow-md`}>
                <div className="text-[10px] uppercase font-bold text-zinc-300">{st.label}</div>
                <div className="text-sm font-mono font-extrabold text-white">
                  {st.amount < 0 ? `-₹${Math.abs(st.amount).toLocaleString()}` : `₹${st.amount.toLocaleString()}`}
                </div>
              </div>
              {idx < steps.length - 1 && (
                <span className="material-icons text-zinc-600 text-sm">arrow_forward</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
