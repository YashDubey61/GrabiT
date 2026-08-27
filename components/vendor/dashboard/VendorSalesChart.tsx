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
    <div className="relative flex flex-col gap-4 rounded-2xl border border-white/[0.10] bg-[#0c0c0e]/80 p-4 sm:p-6 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36)]">
      {/* Top glare */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent opacity-60"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-title font-extrabold text-white">
            Sales &amp; Order Overview
          </h2>
          <p className="text-caption text-zinc-400">
            Revenue trajectory and hourly order distribution
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Metric Selector */}
          <div className="flex rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setActiveMetric("revenue")}
              className={`rounded-xl px-3 py-1 font-display text-caption font-extrabold transition-all cursor-pointer ${
                activeMetric === "revenue"
                  ? "bg-primary text-black shadow-[0_2px_10px_rgba(255,122,0,0.4)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Revenue
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric("orders")}
              className={`rounded-xl px-3 py-1 font-display text-caption font-extrabold transition-all cursor-pointer ${
                activeMetric === "orders"
                  ? "bg-primary text-black shadow-[0_2px_10px_rgba(255,122,0,0.4)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Orders
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1 backdrop-blur-md">
            {(["today", "7d", "30d"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange(tf)}
                className={`rounded-xl px-2.5 py-1 font-display text-caption font-bold capitalize transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-primary/20 text-primary border border-primary/30 font-extrabold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tf === "today" ? "Today" : tf === "7d" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] animate-pulse">
          <span className="material-symbols-outlined text-[28px] text-primary animate-spin">
            progress_activity
          </span>
          <p className="text-caption text-zinc-400">Updating analytics trend...</p>
        </div>
      ) : isError ? (
        <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-6 text-center backdrop-blur-md">
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
              className="rounded-xl bg-white/[0.06] border border-white/[0.12] px-4 py-2 font-display text-caption font-bold text-white hover:border-primary cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      ) : hourlyVolume.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] text-center">
          <span className="material-symbols-outlined text-[32px] text-zinc-500">
            bar_chart
          </span>
          <p className="text-caption text-zinc-400">No sales activity recorded for this timeframe.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <span className="text-caption text-zinc-400">
                {activeMetric === "revenue" ? "Total Revenue" : "Total Volume"}
              </span>
              <p className="font-display text-headline font-extrabold text-white font-mono">
                {activeMetric === "revenue" ? `₹${totalRevenue.toLocaleString()}` : `${totalOrders} orders`}
              </p>
            </div>

            <div className="flex items-center gap-4 text-caption text-zinc-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_6px_rgba(255,122,0,0.6)]" />
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
                <div className="absolute -top-9 hidden group-hover:flex flex-col items-center rounded-xl bg-white px-2.5 py-1 text-[10px] font-bold text-black shadow-lg z-10 whitespace-nowrap">
                  <span>
                    {point.label}: {point.heightPercent}% volume
                  </span>
                </div>

                {/* Bar */}
                <div className="w-full max-w-[36px] rounded-t-xl bg-white/[0.04] overflow-hidden flex items-end h-full">
                  <div
                    className={`w-full rounded-t-xl transition-all duration-500 ${
                      point.isPeak
                        ? "bg-gradient-to-t from-primary to-orange-400 shadow-[0_0_12px_rgba(255,122,0,0.4)]"
                        : "bg-primary/70 group-hover:bg-primary"
                    }`}
                    style={{ height: `${Math.max(12, point.heightPercent)}%` }}
                  />
                </div>

                {/* Label */}
                <span
                  className={`font-display text-[11px] ${
                    point.isPeak ? "font-extrabold text-primary" : "text-zinc-500"
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
