"use client";

import type { RiskOverviewStats } from "@/lib/supabase/superadmin_risk";

interface RiskOverviewCardsProps {
  stats: RiskOverviewStats;
  isLoading?: boolean;
}

export function RiskOverviewCards({ stats, isLoading = false }: RiskOverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 min-[320px]:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-border bg-surface-elevated/50 p-3.5 animate-pulse flex flex-col justify-between"
          >
            <div className="h-3 w-16 bg-border/40 rounded" />
            <div className="h-6 w-12 bg-border/60 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const items = [
    {
      title: "High Risk",
      value: stats.highRiskCases.toLocaleString(),
      icon: "warning",
      iconBg: "bg-rose-500/10 text-rose-400",
    },
    {
      title: "Medium Risk",
      value: stats.mediumRiskCases.toLocaleString(),
      icon: "error_med",
      iconBg: "bg-amber-500/10 text-amber-400",
    },
    {
      title: "Low Risk",
      value: stats.lowRiskCases.toLocaleString(),
      icon: "info",
      iconBg: "bg-emerald-500/10 text-emerald-400",
    },
    {
      title: "Open Cases",
      value: stats.openInvestigations.toLocaleString(),
      icon: "travel_explore",
      iconBg: "bg-primary/10 text-primary",
    },
    {
      title: "Resolved",
      value: stats.resolvedCases.toLocaleString(),
      icon: "task_alt",
      iconBg: "bg-teal-500/10 text-teal-400",
    },
    {
      title: "Orders Risk",
      value: stats.suspiciousOrders.toLocaleString(),
      icon: "shopping_bag",
      iconBg: "bg-blue-500/10 text-blue-400",
    },
    {
      title: "Accounts Risk",
      value: stats.suspiciousAccounts.toLocaleString(),
      icon: "person_alert",
      iconBg: "bg-purple-500/10 text-purple-400",
    },
    {
      title: "Payments Anomaly",
      value: stats.paymentAnomalies.toLocaleString(),
      icon: "account_balance",
      iconBg: "bg-amber-500/10 text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 min-[320px]:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
      {items.map((item) => (
        <div
          key={item.title}
          className="flex flex-col justify-between rounded-2xl border border-border bg-surface-elevated p-3.5 transition-all duration-200 hover:border-primary/40 hover:shadow-lg"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="font-display text-[11px] font-bold text-muted truncate">
              {item.title}
            </span>
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${item.iconBg}`}>
              <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="font-display text-title font-extrabold text-foreground tracking-tight">
              {item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
