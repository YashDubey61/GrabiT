"use client";

import type { VendorMenuItem } from "@/lib/mock/vendor";

export interface VendorMenuStatsCardsProps {
  items: VendorMenuItem[];
  categoriesCount: number;
}

export function VendorMenuStatsCards({
  items,
  categoriesCount,
}: VendorMenuStatsCardsProps) {
  const totalItems = items.length;
  const availableItems = items.filter((i) => i.inStock).length;
  const unavailableItems = items.filter((i) => !i.inStock).length;

  const stats = [
    {
      title: "Total Items",
      value: totalItems.toLocaleString(),
      icon: "restaurant",
      color: "text-primary bg-primary/10",
    },
    {
      title: "Available",
      value: availableItems.toLocaleString(),
      icon: "check_circle",
      color: "text-emerald-400 bg-emerald-500/10",
    },
    {
      title: "Out of Stock",
      value: unavailableItems.toLocaleString(),
      icon: "do_not_disturb_on",
      color: "text-danger bg-danger/10",
    },
    {
      title: "Categories",
      value: categoriesCount.toLocaleString(),
      icon: "category",
      color: "text-blue-400 bg-blue-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-6">
      {stats.map((s) => (
        <div
          key={s.title}
          className="flex flex-col justify-between rounded-2xl border border-border bg-surface-elevated p-4 backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-caption font-bold text-muted">
              {s.title}
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${s.color}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {s.icon}
              </span>
            </div>
          </div>
          <span className="mt-2 font-display text-title font-extrabold tracking-tight text-foreground sm:text-headline">
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
}
