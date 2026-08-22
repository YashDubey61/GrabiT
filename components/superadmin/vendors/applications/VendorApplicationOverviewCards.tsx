"use client";

import type { VendorApplicationStats } from "@/lib/supabase/superadmin_vendor_applications";

interface VendorApplicationOverviewCardsProps {
  stats: VendorApplicationStats;
  isLoading?: boolean;
}

export function VendorApplicationOverviewCards({
  stats,
  isLoading = false,
}: VendorApplicationOverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 min-[320px]:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
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
      title: "Total Apps",
      value: stats.totalApplications.toLocaleString(),
      icon: "assignment",
      iconBg: "bg-primary/10 text-primary",
    },
    {
      title: "Pending Review",
      value: stats.pendingReview.toLocaleString(),
      icon: "pending_actions",
      iconBg: "bg-amber-500/10 text-amber-400",
    },
    {
      title: "Approved",
      value: stats.approvedVendors.toLocaleString(),
      icon: "verified_user",
      iconBg: "bg-emerald-500/10 text-emerald-400",
    },
    {
      title: "Rejected",
      value: stats.rejectedApplications.toLocaleString(),
      icon: "cancel",
      iconBg: "bg-rose-500/10 text-rose-400",
    },
    {
      title: "Suspended",
      value: stats.suspendedVendors.toLocaleString(),
      icon: "pause_circle",
      iconBg: "bg-purple-500/10 text-purple-400",
    },
    {
      title: "KYC Pending",
      value: stats.kycPending.toLocaleString(),
      icon: "badge",
      iconBg: "bg-blue-500/10 text-blue-400",
    },
    {
      title: "KYC Verified",
      value: stats.kycVerified.toLocaleString(),
      icon: "workspace_premium",
      iconBg: "bg-teal-500/10 text-teal-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 min-[320px]:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
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
