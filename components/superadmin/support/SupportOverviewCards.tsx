"use client";

import type { SupportOverviewStats } from "@/lib/supabase/superadmin_support";

interface SupportOverviewCardsProps {
  stats: SupportOverviewStats;
  loading?: boolean;
}

export function SupportOverviewCards({ stats, loading }: SupportOverviewCardsProps) {
  const cards = [
    {
      title: "Open Tickets",
      value: stats.openTickets,
      subtitle: `${stats.unassignedTickets} Unassigned`,
      icon: "confirmation_number",
      color: "border-l-4 border-l-blue-500 text-blue-400 bg-blue-950/20",
    },
    {
      title: "High & Critical Issues",
      value: stats.highPriority,
      subtitle: `${stats.criticalIssues} Critical Escalations`,
      icon: "warning",
      color: "border-l-4 border-l-rose-500 text-rose-400 bg-rose-950/20",
    },
    {
      title: "Waiting Queue",
      value: stats.waitingForCustomer + stats.waitingForVendor,
      subtitle: `${stats.waitingForCustomer} Customer | ${stats.waitingForVendor} Vendor`,
      icon: "hourglass_top",
      color: "border-l-4 border-l-amber-500 text-amber-400 bg-amber-950/20",
    },
    {
      title: "Resolved Today",
      value: stats.resolvedToday,
      subtitle: `Avg Resolution: ${stats.avgResolutionTimeMins} mins`,
      icon: "check_circle",
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
