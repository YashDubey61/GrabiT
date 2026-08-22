"use client";

import { useState } from "react";
import type { RevenueTrendPoint } from "@/lib/supabase/vendor_analytics";

export interface VendorAnalyticsRevenueChartProps {
  trendData: RevenueTrendPoint[];
}

export function VendorAnalyticsRevenueChart({
  trendData,
}: VendorAnalyticsRevenueChartProps) {
  const [metricMode, setMetricMode] = useState<"revenue" | "orders">("revenue");
  const [hoveredPoint, setHoveredPoint] = useState<RevenueTrendPoint | null>(null);

  const values = trendData.map((pt) =>
    metricMode === "revenue" ? pt.revenue : pt.ordersCount,
  );
  const maxVal = Math.max(1, ...values);

  const highestDay = trendData.reduce<RevenueTrendPoint | null>((max, curr) => {
    if (!max || curr.revenue > max.revenue) return curr;
    return max;
  }, null);

  const totalRev = trendData.reduce((sum, p) => sum + p.revenue, 0);
  const totalOrders = trendData.reduce((sum, p) => sum + p.ordersCount, 0);
  const avgDailyRev = trendData.length > 0 ? totalRev / trendData.length : 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Revenue & Order Trends
          </h3>
          <p className="text-caption text-muted">
            Daily performance metrics for the selected timeframe
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-background p-1 border border-border">
            <button
              type="button"
              onClick={() => setMetricMode("revenue")}
              className={`rounded-lg px-3 py-1.5 font-display text-caption font-bold transition-all ${
                metricMode === "revenue"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Revenue (₹)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode("orders")}
              className={`rounded-lg px-3 py-1.5 font-display text-caption font-bold transition-all ${
                metricMode === "orders"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Orders Volume
            </button>
          </div>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-3 gap-3 rounded-xl border border-border/40 bg-background/40 p-3 text-caption">
        <div>
          <span className="text-faint block text-[10px] uppercase font-bold">Total Period Revenue</span>
          <span className="font-display font-bold text-emerald-400">₹{totalRev.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-faint block text-[10px] uppercase font-bold">Avg Daily Revenue</span>
          <span className="font-display font-bold text-primary">₹{avgDailyRev.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-faint block text-[10px] uppercase font-bold">Highest Revenue Day</span>
          <span className="font-display font-bold text-foreground">
            {highestDay && highestDay.revenue > 0
              ? `${highestDay.label} (₹${highestDay.revenue.toFixed(0)})`
              : "N/A"}
          </span>
        </div>
      </div>

      {/* Chart Visualizer */}
      {trendData.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-caption text-muted">
          No trend data recorded in this date range.
        </div>
      ) : (
        <div className="relative pt-6 pb-2">
          {/* Tooltip Popup */}
          {hoveredPoint && (
            <div className="absolute top-0 right-0 rounded-xl border border-primary/40 bg-background px-3 py-1.5 shadow-xl text-caption animate-in fade-in">
              <span className="font-display font-bold text-foreground">{hoveredPoint.label}: </span>
              <span className="font-mono text-emerald-400 font-bold">₹{hoveredPoint.revenue.toFixed(2)} </span>
              <span className="text-muted">({hoveredPoint.ordersCount} orders)</span>
            </div>
          )}

          <div className="flex h-44 items-end gap-2 sm:gap-3 px-2">
            {trendData.map((pt) => {
              const val = metricMode === "revenue" ? pt.revenue : pt.ordersCount;
              const heightPct = Math.max(8, Math.round((val / maxVal) * 100));
              const isHighest = highestDay && highestDay.dateStr === pt.dateStr && pt.revenue > 0;

              return (
                <div
                  key={pt.dateStr}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="group flex flex-1 flex-col items-center gap-2 h-full justify-end cursor-pointer"
                >
                  {/* Bar */}
                  <div className="relative w-full flex justify-center h-full items-end">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[36px] rounded-t-xl transition-all duration-300 ${
                        isHighest
                          ? "bg-gradient-to-t from-primary to-amber-300 shadow-glow-primary"
                          : "bg-primary/70 group-hover:bg-primary"
                      }`}
                    />
                  </div>

                  {/* Date Label */}
                  <span className="font-display text-[10px] font-bold text-faint group-hover:text-foreground transition-colors truncate max-w-[48px]">
                    {pt.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
