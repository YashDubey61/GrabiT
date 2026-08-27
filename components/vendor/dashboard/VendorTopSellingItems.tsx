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
    <div className="relative flex flex-col gap-4 rounded-2xl border border-white/[0.10] bg-[#0c0c0e]/80 p-4 sm:p-6 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36)]">
      {/* Top glare */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent opacity-60"
        aria-hidden="true"
      />

      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div>
          <h2 className="font-display text-title font-extrabold text-white">
            Top Selling Products
          </h2>
          <p className="text-caption text-zinc-400">
            Highest volume and revenue contributors
          </p>
        </div>
        <span className="rounded-full bg-primary/10 border border-primary/25 px-2.5 py-0.5 font-display text-[11px] font-bold text-primary">
          Top {topItems.length}
        </span>
      </div>

      {topItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <span className="material-symbols-outlined text-[32px] text-zinc-500">
            restaurant_menu
          </span>
          <p className="text-caption text-zinc-400">No product sales metrics available yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topItems.map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-md transition-all hover:border-primary/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] font-display text-caption font-bold text-zinc-400 font-mono">
                  #{idx + 1}
                </span>

                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white/[0.05] border border-white/[0.10]">
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
                  <h4 className="truncate font-display text-body-sm font-bold text-white">
                    {item.name}
                  </h4>
                  <p className="text-caption text-zinc-400 font-mono">
                    {item.orderCount} orders sold
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-display text-body-sm font-extrabold text-primary font-mono">
                  ₹{item.revenue.toLocaleString()}
                </span>
                <div className="flex items-center justify-end gap-1 text-[11px] text-emerald-400 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
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
