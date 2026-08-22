"use client";

import type { IncidentOverviewStats } from "@/lib/supabase/superadmin_incidents";

interface IncidentOverviewCardsProps {
  stats: IncidentOverviewStats;
  loading?: boolean;
}

export function IncidentOverviewCards({ stats, loading }: IncidentOverviewCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-24 rounded-xl bg-zinc-900/60 border border-zinc-800 animate-pulse p-4" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Active Incidents",
      value: stats.activeIncidents,
      subtitle: `${stats.investigatingCount} Investigating | ${stats.mitigatingCount} Mitigating`,
      icon: "warning",
      color: stats.activeIncidents > 0 ? "border-l-4 border-l-rose-500 text-rose-400 bg-rose-950/20" : "border-l-4 border-l-emerald-500 text-emerald-400 bg-emerald-950/20",
    },
    {
      title: "SEV-1 & SEV-2 Critical",
      value: `${stats.sev1Count} SEV1 / ${stats.sev2Count} SEV2`,
      subtitle: "High Priority Incident Scope",
      icon: "gpp_maybe",
      color: "border-l-4 border-l-orange-500 text-orange-400 bg-orange-950/20",
    },
    {
      title: "Response MTTA",
      value: `${stats.avgMttaMinutes} min`,
      subtitle: "Mean Time To Acknowledge",
      icon: "timer",
      color: "border-l-4 border-l-amber-500 text-amber-400 bg-amber-950/20",
    },
    {
      title: "Resolution MTTR",
      value: `${stats.avgMttrMinutes} min`,
      subtitle: `${stats.resolvedTodayCount} Incidents Resolved Today`,
      icon: "task_alt",
      color: "border-l-4 border-l-purple-500 text-purple-400 bg-purple-950/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`p-4 rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-lg ${card.color} transition-transform hover:-translate-y-0.5 space-y-2`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              {card.title}
            </span>
            <span className="material-icons text-xl opacity-80">{card.icon}</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {card.value}
          </div>
          <div className="text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2 font-mono">
            {card.subtitle}
          </div>
        </div>
      ))}
    </div>
  );
}
