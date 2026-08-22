"use client";

import type { VendorInventoryItem } from "@/lib/supabase/vendor_inventory";

export interface VendorInventoryStatsCardsProps {
  items: VendorInventoryItem[];
}

export function VendorInventoryStatsCards({ items }: VendorInventoryStatsCardsProps) {
  const totalItems = items.length;
  const inStock = items.filter((i) => i.stockStatus === "IN_STOCK").length;
  const lowStock = items.filter((i) => i.stockStatus === "LOW_STOCK").length;
  const outOfStock = items.filter((i) => i.stockStatus === "OUT_OF_STOCK").length;
  const totalUnits = items.reduce((acc, i) => acc + i.stockQuantity, 0);

  const stats = [
    {
      title: "Total Items",
      value: totalItems.toLocaleString(),
      icon: "inventory_2",
      color: "text-primary bg-primary/10",
    },
    {
      title: "In Stock",
      value: inStock.toLocaleString(),
      icon: "check_circle",
      color: "text-emerald-400 bg-emerald-500/10",
    },
    {
      title: "Low Stock",
      value: lowStock.toLocaleString(),
      icon: "warning",
      color: "text-amber-400 bg-amber-500/10",
    },
    {
      title: "Out of Stock",
      value: outOfStock.toLocaleString(),
      icon: "block",
      color: "text-danger bg-danger/10",
    },
    {
      title: "Total Units",
      value: totalUnits.toLocaleString(),
      icon: "format_list_numbered",
      color: "text-blue-400 bg-blue-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4 mb-6">
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
