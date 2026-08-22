"use client";

import type { ExecutiveOverviewStats } from "@/lib/supabase/superadmin_intelligence";

interface ExecutiveOverviewCardsProps {
  stats: ExecutiveOverviewStats;
  loading?: boolean;
}

export function ExecutiveOverviewCards({ stats, loading }: ExecutiveOverviewCardsProps) {
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
      title: "Total GMV",
      value: `₹${stats.gmv.toLocaleString()}`,
      subtitle: `${stats.totalOrders.toLocaleString()} Total Orders | AOV: ₹${stats.avgOrderValue}`,
      icon: "payments",
      color: "border-l-4 border-l-emerald-500 text-emerald-400 bg-emerald-950/20",
      growth: `+${stats.comparisons.gmvGrowthPct}% vs prev period`,
    },
    {
      title: "Net Revenue",
      value: `₹${stats.platformRevenue.toLocaleString()}`,
      subtitle: `Commission Revenue`,
      icon: "account_balance",
      color: "border-l-4 border-l-blue-500 text-blue-400 bg-blue-950/20",
      growth: `+${stats.comparisons.revenueGrowthPct}% vs prev period`,
    },
    {
      title: "Active Students & Vendors",
      value: `${stats.activeStudents.toLocaleString()} Students`,
      subtitle: `${stats.activeVendors} Active Vendors (${stats.vendorAvailabilityRate}% Avail)`,
      icon: "group",
      color: "border-l-4 border-l-purple-500 text-purple-400 bg-purple-950/20",
      growth: `+${stats.comparisons.studentGrowthPct}% Student Growth`,
    },
    {
      title: "Completion & Rating",
      value: `${stats.completionRate}% Completed`,
      subtitle: `${stats.repeatOrderRate}% Repeat Rate | ⭐ ${stats.avgRating} / 5.0`,
      icon: "task_alt",
      color: "border-l-4 border-l-orange-500 text-orange-400 bg-orange-950/20",
      growth: `Top 1% Operational SLA`,
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
          <div className="flex items-center justify-between text-[11px] border-t border-zinc-800/80 pt-2">
            <span className="text-zinc-400 truncate">{card.subtitle}</span>
            <span className="font-mono text-emerald-400 font-semibold whitespace-nowrap">{card.growth}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
