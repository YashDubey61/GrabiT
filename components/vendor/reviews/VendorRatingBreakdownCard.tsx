"use client";

import type { VendorReviewsData } from "@/lib/supabase/vendor_reviews";

export interface VendorRatingBreakdownCardProps {
  metrics: VendorReviewsData["metrics"];
  distribution: VendorReviewsData["ratingDistribution"];
  selectedRating: string;
  onSelectRatingFilter: (r: string) => void;
}

export function VendorRatingBreakdownCard({
  metrics,
  distribution,
  selectedRating,
  onSelectRatingFilter,
}: VendorRatingBreakdownCardProps) {
  const rows = [
    { stars: 5, count: metrics.fiveStarCount, pct: distribution.fiveStarPct },
    { stars: 4, count: metrics.fourStarCount, pct: distribution.fourStarPct },
    { stars: 3, count: metrics.threeStarCount, pct: distribution.threeStarPct },
    { stars: 2, count: metrics.twoStarCount, pct: distribution.twoStarPct },
    { stars: 1, count: metrics.oneStarCount, pct: distribution.oneStarPct },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-4 sm:p-5 shadow-lg">
      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Rating Breakdown
          </h3>
          <p className="text-caption text-muted">
            Star distribution across all customer reviews
          </p>
        </div>
        <div className="flex items-baseline gap-1 text-amber-400 font-display font-extrabold text-title shrink-0">
          <span>★</span>
          <span>{metrics.overallRating.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((r) => {
          const isSelected = selectedRating === String(r.stars);
          return (
            <button
              key={r.stars}
              type="button"
              onClick={() => onSelectRatingFilter(isSelected ? "all" : String(r.stars))}
              className={`flex items-center gap-2.5 rounded-xl p-2 min-h-[44px] transition-all ${
                isSelected
                  ? "bg-amber-500/15 border border-amber-500/40"
                  : "hover:bg-background/60 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-1 w-10 shrink-0 font-display text-caption font-bold text-foreground">
                <span>{r.stars}</span>
                <span className="text-amber-400">★</span>
              </div>

              {/* Progress Bar */}
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-background border border-border/40 min-w-0">
                <div
                  style={{ width: `${Math.min(100, Math.max(0, r.pct))}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    r.stars >= 4
                      ? "bg-emerald-400"
                      : r.stars === 3
                        ? "bg-amber-400"
                        : "bg-danger"
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-1.5 text-caption w-20 shrink-0 font-mono">
                <span className="text-foreground font-bold">{r.count}</span>
                <span className="text-faint text-[11px]">({r.pct.toFixed(0)}%)</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
