"use client";

import type { CategoryAnalyticsItem } from "@/lib/supabase/vendor_analytics";

export interface VendorAnalyticsCategoryChartProps {
  categories: CategoryAnalyticsItem[];
}

export function VendorAnalyticsCategoryChart({
  categories,
}: VendorAnalyticsCategoryChartProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-lg">
      <div className="border-b border-border/60 pb-3">
        <h3 className="font-display text-title font-bold text-foreground">
          Category Contribution
        </h3>
        <p className="text-caption text-muted">
          Revenue breakdown and order volume across menu categories
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-caption text-muted">
          No category sales recorded in this period.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((c) => (
            <div
              key={c.category}
              className="flex flex-col gap-1 rounded-xl border border-border/50 bg-background/50 p-3"
            >
              <div className="flex items-center justify-between text-body-sm">
                <span className="font-display font-bold text-foreground">
                  {c.category}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-caption text-muted">
                    {c.itemsSold} items ({c.orderCount} orders)
                  </span>
                  <span className="font-display font-extrabold text-emerald-400">
                    ₹{c.revenue.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-background border border-border/40">
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, c.percentageContribution))}%` }}
                    className="h-full rounded-full bg-primary transition-all duration-500"
                  />
                </div>
                <span className="font-mono text-[11px] font-bold text-primary w-12 text-right">
                  {c.percentageContribution.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
