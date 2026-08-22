"use client";

import type { ConfigOverviewStats } from "@/lib/supabase/superadmin_configuration";

interface ConfigOverviewCardsProps {
  stats: ConfigOverviewStats;
  loading?: boolean;
}

export function ConfigOverviewCards({ stats, loading }: ConfigOverviewCardsProps) {
  const lastUpdateDate = stats.lastUpdatedAt
    ? new Date(stats.lastUpdatedAt).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recently";

  const cards = [
    {
      title: "Active Configurations",
      value: stats.activeConfigs,
      subtitle: "Live system business rules",
      icon: "tune",
      color: "border-l-4 border-l-blue-500 text-blue-400 bg-blue-950/20",
    },
    {
      title: "Recently Updated",
      value: stats.recentlyUpdated,
      subtitle: "Modified in last 7 days",
      icon: "history",
      color: "border-l-4 border-l-orange-500 text-orange-400 bg-orange-950/20",
    },
    {
      title: "Config Categories",
      value: stats.categoriesCount,
      subtitle: "System domain sections",
      icon: "category",
      color: "border-l-4 border-l-purple-500 text-purple-400 bg-purple-950/20",
    },
    {
      title: "Last Configuration Update",
      value: stats.lastUpdatedBy,
      subtitle: `Updated: ${lastUpdateDate}`,
      icon: "admin_panel_settings",
      color: "border-l-4 border-l-emerald-500 text-emerald-400 bg-emerald-950/20",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-24 rounded-xl bg-zinc-900/60 border border-zinc-800 animate-pulse p-4" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            <span className="text-xl font-bold text-white tracking-tight truncate max-w-[200px]">
              {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400 truncate">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
