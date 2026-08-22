"use client";

import type { VendorReviewsData } from "@/lib/supabase/vendor_reviews";

export interface VendorReviewsOverviewCardsProps {
  metrics: VendorReviewsData["metrics"];
}

export function VendorReviewsOverviewCards({
  metrics,
}: VendorReviewsOverviewCardsProps) {
  const cards = [
    {
      title: "Overall Rating",
      value: `★ ${metrics.overallRating.toFixed(1)}`,
      icon: "star",
      color: "text-amber-400 bg-amber-500/10",
    },
    {
      title: "Total Reviews",
      value: metrics.totalReviews.toLocaleString(),
      icon: "rate_review",
      color: "text-primary bg-primary/10",
    },
    {
      title: "5-Star Reviews",
      value: metrics.fiveStarCount.toLocaleString(),
      icon: "thumb_up",
      color: "text-emerald-400 bg-emerald-500/10",
    },
    {
      title: "Response Rate",
      value: `${metrics.responseRatePercent.toFixed(1)}%`,
      icon: "reply",
      color: "text-blue-400 bg-blue-500/10",
    },
    {
      title: "Rating This Month",
      value: `★ ${metrics.avgRatingThisMonth.toFixed(1)}`,
      icon: "calendar_month",
      color: "text-purple-400 bg-purple-500/10",
    },
    {
      title: "1 & 2-Star Alerts",
      value: (metrics.oneStarCount + metrics.twoStarCount).toLocaleString(),
      icon: "warning",
      color:
        metrics.oneStarCount + metrics.twoStarCount > 0
          ? "text-danger bg-danger/10"
          : "text-muted bg-surface",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4 mb-6">
      {cards.map((c) => (
        <div
          key={c.title}
          className="flex flex-col justify-between rounded-2xl border border-border bg-surface-elevated p-4 backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-caption font-bold text-muted">
              {c.title}
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${c.color}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {c.icon}
              </span>
            </div>
          </div>

          <span className="mt-2 font-display text-title font-extrabold tracking-tight text-foreground sm:text-headline">
            {c.value}
          </span>
        </div>
      ))}
    </div>
  );
}
