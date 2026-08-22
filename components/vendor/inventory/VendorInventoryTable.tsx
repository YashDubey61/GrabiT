"use client";

import Image from "next/image";
import { useState } from "react";
import type { VendorInventoryItem } from "@/lib/supabase/vendor_inventory";

export interface VendorInventoryTableProps {
  items: VendorInventoryItem[];
  onQuickAdjust: (itemId: string, delta: number) => Promise<void>;
  onToggleAvailability: (itemId: string, inStock: boolean) => Promise<void>;
  onOpenAdjustModal: (item: VendorInventoryItem) => void;
}

export function VendorInventoryTable({
  items,
  onQuickAdjust,
  onToggleAvailability,
  onOpenAdjustModal,
}: VendorInventoryTableProps) {
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  return (
    <div className="flex flex-col gap-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-surface-elevated">
        <table className="w-full text-left text-body-sm">
          <thead className="border-b border-border bg-background/50 font-display text-caption font-bold uppercase tracking-wider text-muted">
            <tr>
              <th className="py-3.5 px-4">Item</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Price</th>
              <th className="py-3.5 px-4 text-center">Stock Level</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Quick Restock</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {items.map((item) => {
              const isLow = item.stockStatus === "LOW_STOCK";
              const isOut = item.stockStatus === "OUT_OF_STOCK";

              return (
                <tr
                  key={item.id}
                  className={`transition-colors hover:bg-background/40 ${
                    isOut
                      ? "bg-danger/5"
                      : isLow
                        ? "bg-amber-500/5"
                        : ""
                  }`}
                >
                  {/* Dish Thumbnail & Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-black border border-border">
                        {!imgErrorMap[item.id] ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            onError={() =>
                              setImgErrorMap((prev) => ({ ...prev, [item.id]: true }))
                            }
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[20px]">
                              fastfood
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-display font-bold text-foreground">
                          {item.name}
                        </span>
                        <span className="text-caption text-faint line-clamp-1">
                          {item.description}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <span className="rounded-md bg-background px-2.5 py-1 font-display text-caption font-bold text-muted border border-border">
                      {item.category}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4 font-display font-bold text-primary">
                    ₹{item.price.toFixed(2)}
                  </td>

                  {/* Stock Quantity */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-title">
                    <span className={isOut ? "text-danger" : isLow ? "text-amber-400" : "text-foreground"}>
                      {item.stockQuantity}
                    </span>
                    <span className="text-[11px] text-faint block font-sans font-normal">
                      (Min: {item.lowStockThreshold})
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-wider ${
                        isOut
                          ? "bg-danger/20 text-danger border border-danger/30"
                          : isLow
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {isOut && <span className="material-symbols-outlined text-[12px]">block</span>}
                      {isLow && <span className="material-symbols-outlined text-[12px]">warning</span>}
                      {item.stockStatus.replace(/_/g, " ")}
                    </span>
                  </td>

                  {/* Quick Adjust Buttons */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onQuickAdjust(item.id, 1)}
                        className="rounded-lg border border-border bg-background px-2 py-1 font-display text-caption font-bold text-muted hover:border-primary/40 hover:text-primary active:scale-95 transition-all"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => onQuickAdjust(item.id, 5)}
                        className="rounded-lg border border-border bg-background px-2 py-1 font-display text-caption font-bold text-muted hover:border-primary/40 hover:text-primary active:scale-95 transition-all"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() => onQuickAdjust(item.id, 10)}
                        className="rounded-lg border border-border bg-background px-2 py-1 font-display text-caption font-bold text-muted hover:border-primary/40 hover:text-primary active:scale-95 transition-all"
                      >
                        +10
                      </button>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenAdjustModal(item)}
                      className="rounded-xl bg-primary/10 border border-primary/30 px-3 py-1.5 font-display text-caption font-bold text-primary hover:bg-primary hover:text-on-primary transition-all"
                    >
                      Adjust
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {items.map((item) => {
          const isLow = item.stockStatus === "LOW_STOCK";
          const isOut = item.stockStatus === "OUT_OF_STOCK";

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 bg-surface-elevated backdrop-blur-md flex flex-col gap-3 ${
                isOut
                  ? "border-danger/40 bg-danger/5"
                  : isLow
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black border border-border">
                    {!imgErrorMap[item.id] ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        onError={() =>
                          setImgErrorMap((prev) => ({ ...prev, [item.id]: true }))
                        }
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[24px]">
                          fastfood
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-display text-body font-bold text-foreground">
                      {item.name}
                    </h4>
                    <span className="text-caption text-primary font-bold">
                      ₹{item.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 font-display text-[10px] font-extrabold uppercase ${
                    isOut
                      ? "bg-danger/20 text-danger border border-danger/30"
                      : isLow
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {item.stockStatus.replace(/_/g, " ")}
                </span>
              </div>

              {/* Stock Quantity Row */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
                <span className="font-display text-caption font-bold text-muted">
                  Current Stock:
                </span>
                <span className="font-mono text-title font-extrabold text-foreground">
                  {item.stockQuantity} units
                </span>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onQuickAdjust(item.id, 5)}
                  className="flex-1 rounded-xl border border-border bg-background py-2 font-display text-caption font-bold text-muted hover:text-foreground"
                >
                  +5 Stock
                </button>
                <button
                  type="button"
                  onClick={() => onQuickAdjust(item.id, 10)}
                  className="flex-1 rounded-xl border border-border bg-background py-2 font-display text-caption font-bold text-muted hover:text-foreground"
                >
                  +10 Stock
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAdjustModal(item)}
                  className="flex-1 rounded-xl bg-primary py-2 font-display text-caption font-extrabold text-on-primary shadow-glow-primary"
                >
                  Adjust
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
