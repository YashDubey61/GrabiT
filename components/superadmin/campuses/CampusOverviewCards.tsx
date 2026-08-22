"use client";

import type { CampusOverviewStats } from "@/lib/supabase/superadmin_campuses";

interface CampusOverviewCardsProps {
  stats: CampusOverviewStats;
  loading?: boolean;
}

export function CampusOverviewCards({ stats, loading }: CampusOverviewCardsProps) {
  const cards = [
    {
      title: "Total Campuses",
      value: stats.totalCampuses,
      subtitle: `${stats.activeCampuses} Active | ${stats.inactiveCampuses} Inactive`,
      icon: "school",
      color: "border-l-4 border-l-blue-500 text-blue-400 bg-blue-950/20",
    },
    {
      title: "Total Students",
      value: stats.totalStudents,
      subtitle: "Onboarded campus students",
      icon: "groups",
      color: "border-l-4 border-l-purple-500 text-purple-400 bg-purple-950/20",
    },
    {
      title: "Canteen Vendors",
      value: stats.totalVendors,
      subtitle: `${stats.activeVendors} Active Storefronts`,
      icon: "storefront",
      color: "border-l-4 border-l-emerald-500 text-emerald-400 bg-emerald-950/20",
    },
    {
      title: "Today's Orders",
      value: stats.todaysOrders,
      subtitle: `Today's GMV: ₹${stats.todaysGmv.toLocaleString()}`,
      icon: "shopping_bag",
      color: "border-l-4 border-l-orange-500 text-orange-400 bg-orange-950/20",
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
