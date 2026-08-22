"use client";

import type { VendorStats } from "@/lib/mock/vendor";

interface VendorStatsBarProps {
  stats: VendorStats;
}

export function VendorStatsBar({ stats }: VendorStatsBarProps) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {/* Pending Orders */}
      <div className="flex flex-col rounded-2xl border border-border bg-surface-elevated p-3.5 backdrop-blur-md sm:p-4">
        <span className="font-display text-[10px] font-bold uppercase tracking-wider text-faint">
          Pending Orders
        </span>
        <span className="font-display text-title font-extrabold text-primary sm:text-[28px]">
          {String(stats.pendingOrders).padStart(2, "0")}
        </span>
      </div>

      {/* Ready for Pickup */}
      <div className="flex flex-col rounded-2xl border border-border bg-surface-elevated p-3.5 backdrop-blur-md sm:p-4">
        <span className="font-display text-[10px] font-bold uppercase tracking-wider text-faint">
          Ready for Pickup
        </span>
        <span className="font-display text-title font-extrabold text-success sm:text-[28px]">
          {String(stats.readyOrders).padStart(2, "0")}
        </span>
      </div>

      {/* Daily Revenue */}
      <div className="flex flex-col rounded-2xl border border-border bg-surface-elevated p-3.5 backdrop-blur-md sm:p-4">
        <span className="font-display text-[10px] font-bold uppercase tracking-wider text-faint">
          Daily Revenue
        </span>
        <span className="font-display text-title font-extrabold text-foreground sm:text-[28px]">
          ₹{stats.dailyRevenue.toLocaleString("en-IN")}
        </span>
      </div>

      {/* Avg. Completion */}
      <div className="flex flex-col rounded-2xl border border-border bg-surface-elevated p-3.5 backdrop-blur-md sm:p-4">
        <span className="font-display text-[10px] font-bold uppercase tracking-wider text-faint">
          Avg. Completion
        </span>
        <span className="font-display text-title font-extrabold text-foreground sm:text-[28px]">
          {stats.avgCompletionMinutes}m
        </span>
      </div>
    </section>
  );
}
