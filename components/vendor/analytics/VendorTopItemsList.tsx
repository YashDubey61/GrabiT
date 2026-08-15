"use client";

import Image from "next/image";
import { useState } from "react";
import type { VendorTopItemMetric } from "@/lib/mock/vendor";

interface VendorTopItemsListProps {
  items: VendorTopItemMetric[];
  onViewAllClick?: () => void;
}

export function VendorTopItemsList({
  items,
  onViewAllClick,
}: VendorTopItemsListProps) {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-[#1e1f26]/80 p-6 backdrop-blur-md">
      <h3 className="font-display text-title font-bold text-foreground">
        Top Items
      </h3>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            {/* Thumbnail */}
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-black">
              {!imgErrors[item.id] ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  onError={() =>
                    setImgErrors((prev) => ({ ...prev, [item.id]: true }))
                  }
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-primary bg-surface-elevated">
                  <span className="material-symbols-outlined text-[20px]">
                    fastfood
                  </span>
                </div>
              )}
            </div>

            {/* Title & Volume */}
            <div className="flex-1 min-w-0">
              <p className="truncate font-display text-body-sm font-bold text-foreground">
                {item.name}
              </p>
              <p className="font-display text-[10px] font-bold uppercase tracking-wider text-faint">
                {item.orderCount} Orders
              </p>
            </div>

            {/* Revenue Metric */}
            <span className="font-display text-body-sm font-extrabold text-primary">
              +₹{item.revenue.toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onViewAllClick}
        className="mt-2 w-full rounded-xl border border-border py-2.5 font-display text-caption font-bold text-foreground transition-colors hover:bg-surface-elevated active:scale-95"
      >
        View All Menu Stats
      </button>
    </div>
  );
}
