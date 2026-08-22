"use client";

import type { VendorAnalyticsData } from "@/lib/supabase/vendor_analytics";

export interface VendorAnalyticsInventoryInsightsProps {
  inventoryInsights: VendorAnalyticsData["inventoryInsights"];
}

export function VendorAnalyticsInventoryInsights({
  inventoryInsights,
}: VendorAnalyticsInventoryInsightsProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-lg">
      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Inventory & Stock Impact Insights
          </h3>
          <p className="text-caption text-muted">
            Stock availability warnings and potential demand bottlenecks
          </p>
        </div>
        <span className="material-symbols-outlined text-amber-400 text-[24px]">inventory_2</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <span className="material-symbols-outlined text-[20px]">format_list_numbered</span>
          </div>
          <div>
            <span className="text-caption text-faint block">Total Stock Units</span>
            <span className="font-display text-title font-extrabold text-foreground">
              {inventoryInsights.totalStockUnits.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </div>
          <div>
            <span className="text-caption text-faint block">Low Stock Alert Items</span>
            <span className="font-display text-title font-extrabold text-amber-400">
              {inventoryInsights.lowStockCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/20 text-danger">
            <span className="material-symbols-outlined text-[20px]">block</span>
          </div>
          <div>
            <span className="text-caption text-faint block">Out of Stock Dishes</span>
            <span className="font-display text-title font-extrabold text-danger">
              {inventoryInsights.outOfStockCount}
            </span>
          </div>
        </div>
      </div>

      {inventoryInsights.topDemandedOutStockItems.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-caption">
          <span className="font-display font-bold text-amber-400 block mb-1">
            Currently Unavailable Dishes (Restock Recommended):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {inventoryInsights.topDemandedOutStockItems.map((itemName) => (
              <span
                key={itemName}
                className="rounded-md border border-amber-500/30 bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground"
              >
                {itemName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
