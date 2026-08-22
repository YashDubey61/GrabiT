"use client";

import { useState } from "react";
import type { VendorHourlyPoint } from "@/lib/mock/vendor";

export interface VendorSalesChartProps {
  hourlyVolume: VendorHourlyPoint[];
  totalRevenue: number;
  totalOrders: number;
  timeframe: "today" | "7d" | "30d";
  onTimeframeChange: (tf: "today" | "7d" | "30d") => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function VendorSalesChart({
  hourlyVolume,
  totalRevenue,
  totalOrders,
  timeframe,
  onTimeframeChange,
  isLoading = false,
  isError = false,
  onRetry,
}: VendorSalesChartProps) {
  const [activeMetric, setActiveMetric] = useState<"revenue" | "orders">("revenue");

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-title font-bold text-foreground">
            Sales & Order Overview
          </h2>
          <p className="text-caption text-muted">
            Revenue trajectory and hourly order distribution
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Metric Selector */}
          <div className="flex rounded-xl border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setActiveMetric("revenue")}
              className={`rounded-lg px-3 py-1 font-display text-caption font-bold transition-all ${
                activeMetric === "revenue"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Revenue
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric("orders")}
              className={`rounded-lg px-3 py-1 font-display text-caption font-bold transition-all ${
                activeMetric === "orders"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Orders
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex rounded-xl border border-border bg-background p-1">
            {(["today", "7d", "30d"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange(tf)}
                className={`rounded-lg px-2.5 py-1 font-display text-caption font-bold capitalize transition-all ${
                  timeframe === tf
                    ? "bg-surface-elevated text-primary border border-primary/30 shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {tf === "today" ? "Today" : tf === "7d" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-background/30 animate-pulse">
          <span className="material-symbols-outlined text-[28px] text-primary animate-spin">
            progress_activity
          </span>
          <p className="text-caption text-muted">Updating analytics trend...</p>
        </div>
      ) : isError ? (
        <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-xl border border-danger/30 bg-danger/5 p-6 text-center">
          <span className="material-symbols-outlined text-[32px] text-danger">
            error
          </span>
          <p className="text-body-sm font-semibold text-danger">
            Failed to load sales trend data.
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-surface-elevated border border-border px-4 py-2 font-display text-caption font-bold text-foreground hover:border-primary"
            >
              Retry
            </button>
          )}
        </div>
      ) : hourlyVolume.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/30 text-center">
          <span className="material-symbols-outlined text-[32px] text-faint">
            bar_chart
          </span>
          <p className="text-caption text-muted">No sales activity recorded for this timeframe.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div>
              <span className="text-caption text-faint">
                {activeMetric === "revenue" ? "Total Revenue" : "Total Volume"}
              </span>
              <p className="font-display text-headline font-extrabold text-foreground">
                {activeMetric === "revenue" ? `₹${totalRevenue.toLocaleString()}` : `${totalOrders} orders`}
              </p>
            </div>

            <div className="flex items-center gap-4 text-caption text-faint">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                Hourly Peak Demand
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="flex h-44 items-end justify-between gap-2 pt-4 px-2">
            {hourlyVolume.map((point, idx) => (
              <div
                key={idx}
                className="group relative flex flex-1 flex-col items-center gap-2 h-full justify-end"
              >
                {/* Tooltip */}
                <div className="absolute -top-9 hidden group-hover:flex flex-col items-center rounded bg-foreground px-2 py-1 text-[10px] font-bold text-background shadow-md z-10 whitespace-nowrap">
                  <span>
                    {point.label}: {point.heightPercent}% volume
                  </span>
                </div>

                {/* Bar */}
                <div className="w-full max-w-[36px] rounded-t-lg bg-border/40 overflow-hidden flex items-end h-full">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      point.isPeak
                        ? "bg-gradient-to-t from-primary to-amber-400"
                        : "bg-primary/70 group-hover:bg-primary"
                    }`}
                    style={{ height: `${Math.max(12, point.heightPercent)}%` }}
                  />
                </div>

                {/* Label */}
                <span
                  className={`font-display text-[11px] ${
                    point.isPeak ? "font-extrabold text-primary" : "text-faint"
                  }`}
                >
                  {point.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
