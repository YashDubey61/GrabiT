"use client";

import type { FlagOverviewStats } from "@/lib/supabase/superadmin_feature_flags";

interface FlagOverviewCardsProps {
  stats: FlagOverviewStats;
  loading?: boolean;
}

export function FlagOverviewCards({ stats, loading }: FlagOverviewCardsProps) {
  const cards = [
    {
      title: "Total Feature Flags",
      value: stats.totalFlags,
      subtitle: "Configured system feature flags",
      icon: "flag",
      color: "border-l-4 border-l-blue-500 text-blue-400 bg-blue-950/20",
    },
    {
      title: "Enabled Flags",
      value: stats.enabled,
      subtitle: "100% active in target scope",
      icon: "check_circle",
      color: "border-l-4 border-l-emerald-500 text-emerald-400 bg-emerald-950/20",
    },
    {
      title: "Gradual Rollouts",
      value: stats.gradualRollouts,
      subtitle: "Percentage-based rollouts",
      icon: "published_with_changes",
      color: "border-l-4 border-l-orange-500 text-orange-400 bg-orange-950/20",
    },
    {
      title: "Scheduled Flags",
      value: stats.scheduled,
      subtitle: "Time-window automated flags",
      icon: "schedule",
      color: "border-l-4 border-l-amber-500 text-amber-400 bg-amber-950/20",
    },
    {
      title: "Disabled Flags",
      value: stats.disabled,
      subtitle: "Inactive or kill-switched",
      icon: "do_not_disturb_on",
      color: "border-l-4 border-l-zinc-500 text-zinc-400 bg-zinc-950/20",
    },
    {
      title: "Production Flags",
      value: stats.productionFlags,
      subtitle: "Live production environment",
      icon: "cloud_done",
      color: "border-l-4 border-l-indigo-500 text-indigo-400 bg-indigo-950/20",
    },
    {
      title: "Experimental Flags",
      value: stats.experimentalFlags,
      subtitle: "Staging / beta features",
      icon: "science",
      color: "border-l-4 border-l-purple-500 text-purple-400 bg-purple-950/20",
    },
    {
      title: "Recently Changed",
      value: stats.recentlyChanged,
      subtitle: "Updated in last 7 days",
      icon: "history",
      color: "border-l-4 border-l-rose-500 text-rose-400 bg-rose-950/20",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="h-24 rounded-xl bg-zinc-900/60 border border-zinc-800 animate-pulse p-4" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`p-4 rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-lg ${card.color} transition-transform hover:-translate-y-0.5`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              {card.title}
            </span>
            <span className="material-icons text-xl opacity-80">{card.icon}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">
              {card.value.toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400 truncate">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
