"use client";

import type { VendorAnalyticsSummary } from "@/lib/mock/vendor";

interface VendorAnalyticsQuickStatsProps {
  summary: VendorAnalyticsSummary;
}

export function VendorAnalyticsQuickStats({
  summary,
}: VendorAnalyticsQuickStatsProps) {
  const ordersProgressPercent = Math.min(
    100,
    Math.round((summary.totalOrders / summary.targetOrders) * 100),
  );

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Card 1: Today's Sales */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-elevated p-4 backdrop-blur-md">
        <span className="font-display text-caption font-bold uppercase tracking-wider text-faint">
          Today&apos;s Sales
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-title font-extrabold text-primary sm:text-[28px]">
            ₹{summary.todaysSales.toLocaleString("en-IN")}
          </span>
          <span className="font-display text-caption font-bold text-success">
            +{summary.salesGrowthPercent}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
          <div className="h-full bg-primary w-3/4 transition-all duration-500" />
        </div>
      </div>

      {/* Card 2: Total Orders */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-elevated p-4 backdrop-blur-md">
        <span className="font-display text-caption font-bold uppercase tracking-wider text-faint">
          Total Orders
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-title font-extrabold text-foreground sm:text-[28px]">
            {summary.totalOrders}
          </span>
          <span className="font-display text-caption font-semibold text-faint">
            / {summary.targetOrders} target
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full bg-white/40 transition-all duration-500"
            style={{ width: `${ordersProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Card 3: Average Prep Time */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-elevated p-4 backdrop-blur-md">
        <span className="font-display text-caption font-bold uppercase tracking-wider text-faint">
          Average Prep Time
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-title font-extrabold text-foreground sm:text-[28px]">
            {summary.avgPrepTimeMinutes} min
          </span>
          <span className="font-display text-caption font-bold text-danger">
            {summary.prepTimeDeltaMinutes} min
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
          <div className="h-full bg-white/20 w-2/3 transition-all duration-500" />
        </div>
      </div>
    </section>
  );
}
