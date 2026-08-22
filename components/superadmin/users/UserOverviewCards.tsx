"use client";

import type { UserManagementStats } from "@/lib/supabase/superadmin_users";

interface UserOverviewCardsProps {
  stats: UserManagementStats;
  isLoading?: boolean;
}

export function UserOverviewCards({ stats, isLoading = false }: UserOverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 min-[320px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-border bg-surface-elevated/50 p-4 animate-pulse flex flex-col justify-between"
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
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: "group",
      iconBg: "bg-primary/10 text-primary",
    },
    {
      title: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      icon: "check_circle",
      iconBg: "bg-emerald-500/10 text-emerald-400",
    },
    {
      title: "Students",
      value: stats.studentsCount.toLocaleString(),
      icon: "school",
      iconBg: "bg-blue-500/10 text-blue-400",
    },
    {
      title: "Vendor Managers",
      value: stats.vendorsCount.toLocaleString(),
      icon: "storefront",
      iconBg: "bg-amber-500/10 text-amber-400",
    },
    {
      title: "Super Admins",
      value: stats.adminsCount.toLocaleString(),
      icon: "shield_person",
      iconBg: "bg-purple-500/10 text-purple-400",
    },
    {
      title: "Suspended",
      value: stats.suspendedCount.toLocaleString(),
      icon: "block",
      iconBg: "bg-rose-500/10 text-rose-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 min-[320px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {items.map((item) => (
        <div
          key={item.title}
          className="flex flex-col justify-between rounded-2xl border border-border bg-surface-elevated p-3.5 sm:p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-lg"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-display text-[11px] font-bold text-muted truncate">
              {item.title}
            </span>
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.iconBg}`}>
              <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="font-display text-headline font-extrabold text-foreground tracking-tight">
              {item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
