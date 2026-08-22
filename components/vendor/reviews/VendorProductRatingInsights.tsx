"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductRatingInsight } from "@/lib/supabase/vendor_reviews";

export interface VendorProductRatingInsightsProps {
  highestRated: ProductRatingInsight[];
  lowestRated: ProductRatingInsight[];
}

export function VendorProductRatingInsights({
  highestRated,
  lowestRated,
}: VendorProductRatingInsightsProps) {
  const [tab, setTab] = useState<"highest" | "lowest">("highest");
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  const list = tab === "highest" ? highestRated : lowestRated;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-4 sm:p-5 shadow-lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Product Rating Leaderboard
          </h3>
          <p className="text-caption text-muted">
            Highest and lowest customer rated dishes
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-background p-1 border border-border shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTab("highest")}
            className={`rounded-lg px-3 py-1.5 font-display text-caption font-bold transition-all ${
              tab === "highest"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Highest Rated
          </button>
          <button
            type="button"
            onClick={() => setTab("lowest")}
            className={`rounded-lg px-3 py-1.5 font-display text-caption font-bold transition-all ${
              tab === "lowest"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Lowest Rated
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <span className="material-symbols-outlined text-[32px] text-muted mb-2">
            analytics
          </span>
          <p className="font-display text-body-sm font-bold text-foreground">
            No product rating insights available yet
          </p>
          <p className="text-caption text-muted max-w-xs mt-1">
            As students rate specific dishes in their orders, item-level leaderboard insights will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {list.map((item) => (
            <div
              key={item.menuItemId}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3 hover:border-primary/40 transition-all"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-black border border-border">
                {!imgErrorMap[item.menuItemId] ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    onError={() =>
                      setImgErrorMap((prev) => ({ ...prev, [item.menuItemId]: true }))
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

              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-display font-bold text-body-sm text-foreground truncate">
                  {item.name}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-display font-extrabold text-caption text-amber-400">
                    ★ {item.avgRating.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-faint truncate">
                    ({item.totalReviews} {item.totalReviews === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
