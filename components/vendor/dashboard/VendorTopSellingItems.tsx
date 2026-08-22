"use client";

import type { VendorTopItemMetric } from "@/lib/mock/vendor";

export interface VendorTopSellingItemsProps {
  topItems: VendorTopItemMetric[];
  isLoading?: boolean;
}

const DEFAULT_ITEM_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80";

export function VendorTopSellingItems({
  topItems,
  isLoading = false,
}: VendorTopSellingItemsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-4 sm:p-6">
        <div className="h-6 w-40 bg-border/40 rounded animate-pulse" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl border border-border/60 bg-background/30 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-4 sm:p-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h2 className="font-display text-title font-bold text-foreground">
            Top Selling Products
          </h2>
          <p className="text-caption text-muted">
            Highest volume and revenue contributors
          </p>
        </div>
        <span className="font-display text-caption font-bold text-primary">
          Top {topItems.length}
        </span>
      </div>

      {topItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <span className="material-symbols-outlined text-[32px] text-faint">
            restaurant_menu
          </span>
          <p className="text-caption text-muted">No product sales metrics available yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topItems.map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 p-3 transition-all hover:border-border"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-elevated font-display text-caption font-bold text-muted">
                  #{idx + 1}
                </span>

                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-border/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl || DEFAULT_ITEM_IMAGE}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_ITEM_IMAGE;
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-display text-body-sm font-bold text-foreground">
                    {item.name}
                  </h4>
                  <p className="text-caption text-muted">
                    {item.orderCount} orders sold
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-display text-body-sm font-extrabold text-primary">
                  ₹{item.revenue.toLocaleString()}
                </span>
                <div className="flex items-center justify-end gap-1 text-[11px] text-emerald-400 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  In Stock
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
