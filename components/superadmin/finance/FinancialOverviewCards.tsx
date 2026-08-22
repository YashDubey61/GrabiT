"use client";

import type { FinancialOverviewStats } from "@/lib/supabase/superadmin_finance";

interface FinancialOverviewCardsProps {
  stats: FinancialOverviewStats;
  loading?: boolean;
}

export function FinancialOverviewCards({ stats, loading }: FinancialOverviewCardsProps) {
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
      title: "Total Platform GMV",
      value: `₹${stats.totalGmv.toLocaleString()}`,
      subtitle: `${stats.totalOrders.toLocaleString()} Total Orders | AOV: ₹${stats.avgOrderValue}`,
      icon: "payments",
      color: "border-l-4 border-l-emerald-500 text-emerald-400 bg-emerald-950/20",
      growth: `+${stats.prevPeriodComparison.gmvGrowthPct}% vs prev period`,
    },
    {
      title: "Net Platform Revenue",
      value: `₹${stats.netRevenue.toLocaleString()}`,
      subtitle: `GRABIT Platform Commission Collected`,
      icon: "account_balance",
      color: "border-l-4 border-l-blue-500 text-blue-400 bg-blue-950/20",
      growth: `+${stats.prevPeriodComparison.revenueGrowthPct}% vs prev period`,
    },
    {
      title: "Vendor Earnings",
      value: `₹${stats.vendorEarnings.toLocaleString()}`,
      subtitle: `Settled Payouts: ₹${stats.totalPayouts.toLocaleString()}`,
      icon: "storefront",
      color: "border-l-4 border-l-purple-500 text-purple-400 bg-purple-950/20",
      growth: `+${stats.prevPeriodComparison.payoutGrowthPct}% vs prev period`,
    },
    {
      title: "Refunds & Adjustments",
      value: `₹${stats.totalRefunds.toLocaleString()}`,
      subtitle: `Dispute Refund Impact`,
      icon: "published_with_changes",
      color: "border-l-4 border-l-orange-500 text-orange-400 bg-orange-950/20",
      growth: `Nominal dispute rate (<1%)`,
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
