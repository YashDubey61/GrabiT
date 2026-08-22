"use client";

import type { PeakHourPoint, VendorAnalyticsData } from "@/lib/supabase/vendor_analytics";

export interface VendorAnalyticsPeakHoursProps {
  peakHours: PeakHourPoint[];
  summary: VendorAnalyticsData["peakHourSummary"];
}

export function VendorAnalyticsPeakHours({
  peakHours,
  summary,
}: VendorAnalyticsPeakHoursProps) {
  const maxVal = Math.max(1, ...peakHours.map((p) => p.ordersCount));

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-lg">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Peak Ordering Hours
          </h3>
          <p className="text-caption text-muted">
            Demand volume by hour of day (IST Timezone)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-caption font-bold text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>Peak Hour: {summary.peakHourLabel}</span>
          </div>
        </div>
      </div>

      {/* Hourly Bar Chart */}
      <div className="relative pt-4 pb-2">
        <div className="flex h-36 items-end gap-1 overflow-x-auto pb-1">
          {peakHours.map((pt) => {
            const heightPct = Math.max(6, Math.round((pt.ordersCount / maxVal) * 100));
            return (
              <div
                key={pt.hour24}
                className="group flex flex-1 flex-col items-center gap-1.5 h-full justify-end min-w-[20px]"
                title={`${pt.hourLabel}: ${pt.ordersCount} orders`}
              >
                <div className="relative w-full flex justify-center h-full items-end">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[16px] rounded-t-md transition-all duration-300 ${
                      pt.isPeak
                        ? "bg-gradient-to-t from-primary to-amber-300 shadow-glow-primary"
                        : pt.ordersCount > 0
                          ? "bg-primary/70 group-hover:bg-primary"
                          : "bg-border/40"
                    }`}
                  />
                </div>
                {pt.hour24 % 3 === 0 && (
                  <span className="font-display text-[9px] font-bold text-faint group-hover:text-foreground">
                    {pt.hourLabel}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
