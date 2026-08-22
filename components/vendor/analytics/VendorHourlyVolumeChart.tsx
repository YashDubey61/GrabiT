"use client";

import { useState } from "react";
import type { VendorHourlyPoint } from "@/lib/mock/vendor";

interface VendorHourlyVolumeChartProps {
  data: VendorHourlyPoint[];
  onTimeframeChange?: (timeframe: string) => void;
}

export function VendorHourlyVolumeChart({
  data,
  onTimeframeChange,
}: VendorHourlyVolumeChartProps) {
  const [timeframe, setTimeframe] = useState<"Today" | "7 Days" | "30 Days">(
    "Today",
  );

  const handleSelectTimeframe = (tf: "Today" | "7 Days" | "30 Days") => {
    setTimeframe(tf);
    onTimeframeChange?.(tf);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface-elevated p-6 backdrop-blur-md">
      {/* Header & Filter Switch */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Hourly Volume
          </h3>
          <p className="text-body-sm text-faint">
            Peak canteen order distribution across hours.
          </p>
        </div>

        {/* Timeframe Chips */}
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface-sunken p-1">
          {(["Today", "7 Days", "30 Days"] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => handleSelectTimeframe(tf)}
              className={`rounded-lg px-3 py-1.5 text-center font-display text-caption font-bold transition-all ${
                timeframe === tf
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="flex h-48 w-full items-end justify-between gap-2 pt-4">
        {data.map((point, idx) => (
          <div
            key={idx}
            className="group relative flex flex-1 flex-col items-center gap-2 h-full justify-end"
          >
            {/* Tooltip on Hover */}
            <div className="pointer-events-none absolute -top-8 hidden rounded bg-surface-sunken px-2 py-1 font-mono text-[10px] font-bold text-foreground group-hover:block z-10 border border-border shadow-md">
              {point.heightPercent}% volume
            </div>

            {/* Bar */}
            <div
              className={`w-full rounded-t-md transition-all duration-300 ${
                point.isPeak
                  ? "bg-primary shadow-glow-primary shadow-[0_0_15px_rgba(255,109,0,0.4)]"
                  : "bg-white/10 group-hover:bg-primary/40"
              }`}
              style={{ height: `${point.heightPercent}%` }}
            />

            {/* Label */}
            <span className="font-display text-[11px] font-bold text-faint">
              {point.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
