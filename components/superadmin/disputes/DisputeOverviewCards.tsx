"use client";

import type { DisputeOverviewStats } from "@/lib/supabase/superadmin_disputes";

interface DisputeOverviewCardsProps {
  stats: DisputeOverviewStats;
  isLoading?: boolean;
}

export function DisputeOverviewCards({ stats, isLoading = false }: DisputeOverviewCardsProps) {
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
      title: "Open Disputes",
      value: stats.openDisputes.toLocaleString(),
      icon: "assignment_late",
      iconBg: "bg-primary/10 text-primary",
    },
    {
      title: "Pending Review",
      value: stats.pendingReview.toLocaleString(),
      icon: "rate_review",
      iconBg: "bg-amber-500/10 text-amber-400",
    },
    {
      title: "High Priority",
      value: stats.highPriority.toLocaleString(),
      icon: "priority_high",
      iconBg: "bg-rose-500/10 text-rose-400",
    },
    {
      title: "Refund Requested",
      value: stats.refundRequested.toLocaleString(),
      icon: "currency_rupee",
      iconBg: "bg-blue-500/10 text-blue-400",
    },
    {
      title: "Refund Approved",
      value: stats.refundApproved.toLocaleString(),
      icon: "rule",
      iconBg: "bg-teal-500/10 text-teal-400",
    },
    {
      title: "Refund Completed",
      value: stats.refundCompleted.toLocaleString(),
      icon: "task_alt",
      iconBg: "bg-emerald-500/10 text-emerald-400",
    },
    {
      title: "Resolved",
      value: stats.resolvedDisputes.toLocaleString(),
      icon: "check_circle",
      iconBg: "bg-teal-500/10 text-teal-400",
    },
    {
      title: "Refunded Vol.",
      value: `₹${stats.totalRefundAmount.toLocaleString()}`,
      icon: "payments",
      iconBg: "bg-purple-500/10 text-purple-400",
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
