"use client";

import type { PlatformHealthScoreData } from "@/lib/supabase/superadmin_intelligence";

interface PlatformHealthScoreBannerProps {
  healthScore: PlatformHealthScoreData;
}

export function PlatformHealthScoreBanner({ healthScore }: PlatformHealthScoreBannerProps) {
  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 border-emerald-800 bg-emerald-950/30";
    if (score >= 75) return "text-amber-400 border-amber-800 bg-amber-950/30";
    return "text-rose-400 border-rose-800 bg-rose-950/30";
  };

  const pillarsList = [
    { key: "operations", ...healthScore.pillars.operations, icon: "task_alt" },
    { key: "payments", ...healthScore.pillars.payments, icon: "account_balance" },
    { key: "customerExperience", ...healthScore.pillars.customerExperience, icon: "star" },
    { key: "vendorHealth", ...healthScore.pillars.vendorHealth, icon: "storefront" },
    { key: "security", ...healthScore.pillars.security, icon: "shield" },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl space-y-4 mb-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-icons text-2xl text-orange-400">insights</span>
            <h2 className="text-lg font-bold text-white">Platform Health Index & Telemetry</h2>
          </div>
          <p className="text-xs text-zinc-400">
            Explainable weighted index derived from live operations, payments, customer experience, vendor health, and security signals
          </p>
        </div>

        <div className={`flex items-baseline gap-1 px-4 py-2 rounded-xl border ${getScoreBadgeColor(healthScore.overallScore)} self-start sm:self-auto shadow-md`}>
          <span className="text-3xl font-mono font-extrabold text-white">{healthScore.overallScore}</span>
          <span className="text-xs font-mono text-zinc-400">/ 100</span>
        </div>
      </div>

      {/* 5 Pillar Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {pillarsList.map((p) => (
          <div key={p.key} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400">
              <span className="truncate">{p.label}</span>
              <span className="material-icons text-sm text-orange-400">{p.icon}</span>
            </div>
            <div className="text-lg font-mono font-bold text-white">{p.score} <span className="text-xs text-zinc-500 font-normal">/ 100</span></div>
            <p className="text-[10px] text-zinc-400 truncate">{p.metric}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
