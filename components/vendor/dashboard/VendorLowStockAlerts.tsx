"use client";

import { type VendorMenuItem } from "@/lib/mock/vendor";
import Link from "next/link";

export interface VendorLowStockAlertsProps {
  menuItems: VendorMenuItem[];
  onToggleStock: (itemId: string, inStock: boolean) => void;
  isLoading?: boolean;
}

export function VendorLowStockAlerts({
  menuItems,
  onToggleStock,
  isLoading = false,
}: VendorLowStockAlertsProps) {
  const unavailableItems = menuItems.filter((i) => !i.inStock);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-4 sm:p-6">
        <div className="h-6 w-48 bg-border/40 rounded animate-pulse" />
        <div className="h-16 rounded-xl border border-border/60 bg-background/30 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-4 sm:p-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-amber-400">
            warning
          </span>
          <div>
            <h2 className="font-display text-title font-bold text-foreground">
              Low Stock & Availability Alerts
            </h2>
            <p className="text-caption text-muted">
              Dishes currently marked unavailable or out of stock
            </p>
          </div>
        </div>
        <Link
          href="/vendor/menu"
          className="font-display text-caption font-bold text-primary hover:underline underline-offset-4"
        >
          Manage Menu
        </Link>
      </div>

      {unavailableItems.length === 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[22px] text-emerald-400">
              check_circle
            </span>
            <div>
              <p className="font-display text-body-sm font-bold text-foreground">
                All Menu Items Available
              </p>
              <p className="text-caption text-emerald-400/90">
                0 dishes currently out of stock. Students can order full menu.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {unavailableItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-border/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover grayscale opacity-70"
                  />
                </div>

                <div className="min-w-0">
                  <h4 className="truncate font-display text-body-sm font-bold text-foreground">
                    {item.name}
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Out of Stock
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleStock(item.id, true)}
                className="shrink-0 rounded-lg bg-primary/10 border border-primary/30 px-3 py-1.5 font-display text-caption font-bold text-primary hover:bg-primary hover:text-on-primary active:scale-95 transition-all"
              >
                Mark In Stock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
