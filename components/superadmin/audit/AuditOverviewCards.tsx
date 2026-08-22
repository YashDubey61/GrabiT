"use client";

import type { AuditOverviewStats } from "@/lib/supabase/superadmin_audit";

interface AuditOverviewCardsProps {
  stats: AuditOverviewStats;
  loading?: boolean;
}

export function AuditOverviewCards({ stats, loading }: AuditOverviewCardsProps) {
  const cards = [
    {
      title: "Total Audit Events",
      value: stats.totalEvents,
      subtitle: "Lifetime recorded actions",
      icon: "receipt_long",
      color: "border-l-4 border-l-blue-500 text-blue-400 bg-blue-950/20",
    },
    {
      title: "Today's Events",
      value: stats.todayEvents,
      subtitle: "Logged in last 24h",
      icon: "schedule",
      color: "border-l-4 border-l-orange-500 text-orange-400 bg-orange-950/20",
    },
    {
      title: "Admin Actions",
      value: stats.adminActions,
      subtitle: "Super Admin operations",
      icon: "admin_panel_settings",
      color: "border-l-4 border-l-emerald-500 text-emerald-400 bg-emerald-950/20",
    },
    {
      title: "Security Events",
      value: stats.securityEvents,
      subtitle: "Auth & credential changes",
      icon: "security",
      color: "border-l-4 border-l-purple-500 text-purple-400 bg-purple-950/20",
    },
    {
      title: "Financial Actions",
      value: stats.financialActions,
      subtitle: "Refunds & payouts",
      icon: "payments",
      color: "border-l-4 border-l-teal-500 text-teal-400 bg-teal-950/20",
    },
    {
      title: "Vendor Actions",
      value: stats.vendorActions,
      subtitle: "Approvals & suspensions",
      icon: "storefront",
      color: "border-l-4 border-l-amber-500 text-amber-400 bg-amber-950/20",
    },
    {
      title: "User Actions",
      value: stats.userActions,
      subtitle: "Role & status changes",
      icon: "manage_accounts",
      color: "border-l-4 border-l-indigo-500 text-indigo-400 bg-indigo-950/20",
    },
    {
      title: "Critical Events",
      value: stats.criticalEvents,
      subtitle: "High/Critical severity",
      icon: "warning",
      color: "border-l-4 border-l-rose-500 text-rose-400 bg-rose-950/20",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="h-24 rounded-xl bg-zinc-900/60 border border-zinc-800 animate-pulse p-4"
          />
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
          <p className="mt-1 text-[11px] text-zinc-400">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
