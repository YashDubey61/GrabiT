"use client";

import Image from "next/image";
import { useState } from "react";
import type { VendorMenuItem } from "@/lib/mock/vendor";

interface VendorMenuItemCardProps {
  item: VendorMenuItem;
  onToggleStock: (itemId: string, inStock: boolean) => void;
  onEditItem: (item: VendorMenuItem) => void;
}

export function VendorMenuItemCard({
  item,
  onToggleStock,
  onEditItem,
}: VendorMenuItemCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group rounded-2xl border border-border bg-[#1e1f26]/80 p-4 backdrop-blur-md transition-all duration-300 hover:border-primary/40">
      <div className="flex gap-4">
        {/* Dish Thumbnail */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-black border border-border">
          {!imgError ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              onError={() => setImgError(true)}
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-primary bg-surface-elevated">
              <span className="material-symbols-outlined text-[32px]">
                fastfood
              </span>
            </div>
          )}
        </div>

        {/* Dish Info & Actions */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-display text-body font-bold text-foreground">
                {item.name}
              </h4>
              <button
                type="button"
                onClick={() => onEditItem(item)}
                aria-label={`Edit ${item.name}`}
                className="rounded-lg p-1 text-primary transition-colors hover:bg-primary/10"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  edit
                </span>
              </button>
            </div>

            <p className="line-clamp-1 text-body-sm text-faint">
              {item.description}
            </p>

            <span className="mt-1 block font-display text-body font-bold text-primary">
              ₹{item.price.toFixed(2)}
            </span>
          </div>

          {/* Stock Availability Toggle */}
          <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2">
            <span
              className={`font-display text-[11px] font-bold uppercase tracking-wider ${
                item.inStock ? "text-muted" : "text-danger"
              }`}
            >
              {item.inStock ? "In Stock" : "Out of Stock"}
            </span>

            <button
              type="button"
              onClick={() => onToggleStock(item.id, !item.inStock)}
              aria-label={`Toggle stock status for ${item.name}`}
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                item.inStock ? "bg-primary" : "bg-border"
              }`}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  item.inStock ? "right-0.5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
