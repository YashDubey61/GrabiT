"use client";

import type { VendorAnalyticsData } from "@/lib/supabase/vendor_analytics";

export interface VendorAnalyticsOrdersBreakdownProps {
  breakdown: VendorAnalyticsData["orderStatusBreakdown"];
  totalOrders: number;
  avgPrepTimeMinutes?: number;
}

export function VendorAnalyticsOrdersBreakdown({
  breakdown,
  totalOrders,
  avgPrepTimeMinutes,
}: VendorAnalyticsOrdersBreakdownProps) {
  const getPercent = (count: number) =>
    totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(1) : "0.0";

  const statuses = [
    {
      label: "Completed",
      count: breakdown.completed,
      pct: getPercent(breakdown.completed),
      color: "bg-emerald-400 text-emerald-400",
      icon: "check_circle",
    },
    {
      label: "Preparing",
      count: breakdown.preparing,
      pct: getPercent(breakdown.preparing),
      color: "bg-amber-400 text-amber-400",
      icon: "soup_kitchen",
    },
    {
      label: "Ready for Pickup",
      count: breakdown.ready,
      pct: getPercent(breakdown.ready),
      color: "bg-blue-400 text-blue-400",
      icon: "takeout_dining",
    },
    {
      label: "New / Placed",
      count: breakdown.placed,
      pct: getPercent(breakdown.placed),
      color: "bg-primary text-primary",
      icon: "shopping_bag",
    },
    {
      label: "Cancelled / Rejected",
      count: breakdown.cancelled,
      pct: getPercent(breakdown.cancelled),
      color: "bg-danger text-danger",
      icon: "cancel",
    },
  ];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface-elevated p-5 shadow-lg">
      <div className="border-b border-border/60 pb-3">
        <h3 className="font-display text-title font-bold text-foreground">
          Order Status Breakdown
        </h3>
        <p className="text-caption text-muted">
          Distribution of order states across the selected period
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {statuses.map((s) => (
          <div key={s.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-caption font-bold">
              <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-[16px] ${s.color.split(" ")[1]}`}>
                  {s.icon}
                </span>
                <span className="text-foreground">{s.label}</span>
              </div>
              <span className="text-muted font-mono">
                {s.count} <span className="text-faint font-sans">({s.pct}%)</span>
              </span>
            </div>

            {/* Progress Track */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-background border border-border/40">
              <div
                style={{ width: `${Math.min(100, Math.max(0, Number(s.pct)))}%` }}
                className={`h-full rounded-full transition-all duration-500 ${s.color.split(" ")[0]}`}
              />
            </div>
          </div>
        ))}
      </div>

      {avgPrepTimeMinutes !== undefined && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">timer</span>
            <span className="font-display text-caption font-bold text-foreground">
              Average Prep SLA
            </span>
          </div>
          <span className="font-display text-title font-extrabold text-primary">
            ~{avgPrepTimeMinutes.toFixed(1)} mins
          </span>
        </div>
      )}
    </div>
  );
}
