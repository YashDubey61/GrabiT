"use client";

import type { VendorAnalyticsData } from "@/lib/supabase/vendor_analytics";

export interface VendorAnalyticsOverviewCardsProps {
  metrics: VendorAnalyticsData["metrics"];
}

export function VendorAnalyticsOverviewCards({
  metrics,
}: VendorAnalyticsOverviewCardsProps) {
  const cards = [
    {
      title: "Total Revenue",
      value: `₹${metrics.totalRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      growth: metrics.revenueGrowthPercent,
      icon: "payments",
      color: "text-emerald-400 bg-emerald-500/10",
    },
    {
      title: "Total Orders",
      value: metrics.totalOrders.toLocaleString(),
      growth: metrics.ordersGrowthPercent,
      icon: "shopping_bag",
      color: "text-primary bg-primary/10",
    },
    {
      title: "Average Order Value",
      value: `₹${metrics.avgOrderValue.toFixed(2)}`,
      growth: metrics.aovGrowthPercent,
      icon: "analytics",
      color: "text-blue-400 bg-blue-500/10",
    },
    {
      title: "Items Sold",
      value: metrics.itemsSold.toLocaleString(),
      icon: "fastfood",
      color: "text-amber-400 bg-amber-500/10",
    },
    {
      title: "Completion Rate",
      value: `${metrics.completionRate.toFixed(1)}%`,
      icon: "check_circle",
      color: "text-purple-400 bg-purple-500/10",
    },
    {
      title: "Cancellation Rate",
      value: `${metrics.cancellationRate.toFixed(1)}%`,
      icon: "cancel",
      color: metrics.cancellationRate > 5 ? "text-danger bg-danger/10" : "text-muted bg-surface",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4 mb-6">
      {cards.map((c) => (
        <div
          key={c.title}
          className="flex flex-col justify-between rounded-2xl border border-border bg-surface-elevated p-4 backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-caption font-bold text-muted">
              {c.title}
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${c.color}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {c.icon}
              </span>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-1">
            <span className="font-display text-title font-extrabold tracking-tight text-foreground sm:text-headline">
              {c.value}
            </span>

            {c.growth !== undefined && (
              <div className="flex items-center gap-1">
                <span
                  className={`font-display text-[11px] font-bold ${
                    c.growth >= 0 ? "text-emerald-400" : "text-danger"
                  }`}
                >
                  {c.growth >= 0 ? `+${c.growth.toFixed(1)}%` : `${c.growth.toFixed(1)}%`}
                </span>
                <span className="text-[10px] text-faint">vs prev period</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
