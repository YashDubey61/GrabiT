"use client";

import Link from "next/link";
import type { ActionableInsightItem } from "@/lib/supabase/superadmin_intelligence";

interface ActionableInsightsPanelProps {
  insights: ActionableInsightItem[];
}

export function ActionableInsightsPanel({ insights }: ActionableInsightsPanelProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-icons text-orange-400">auto_awesome</span>
          <h3 className="text-base font-bold text-white">Actionable Executive Intelligence Insights</h3>
        </div>
        <span className="text-xs font-mono text-zinc-400">{insights.length} Empirical Insights</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((ins) => (
          <div
            key={ins.id}
            className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-3 hover:border-zinc-700 transition-colors shadow-md flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                    ins.severity === "HIGH" || ins.severity === "CRITICAL"
                      ? "bg-rose-950/80 text-rose-300 border-rose-800"
                      : "bg-blue-950/80 text-blue-300 border-blue-800"
                  }`}
                >
                  {ins.severity}
                </span>
                <span className="text-[11px] font-mono text-orange-400 font-semibold">{ins.supportingMetric}</span>
              </div>

              <h4 className="text-sm font-bold text-white">{ins.title}</h4>
              <p className="text-xs text-zinc-300 leading-relaxed">{ins.evidence}</p>

              <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800/60 text-xs text-emerald-300 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Recommended Action:</span>
                <span>{ins.recommendedAction}</span>
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-3 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Target Module: {ins.relatedModule}</span>
              <Link
                href={ins.relatedModuleLink}
                className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded transition-colors text-xs"
              >
                Execute Rationale
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
