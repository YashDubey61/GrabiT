"use client";

import Image from "next/image";
import { useState } from "react";
import type { VendorReviewItem } from "@/lib/supabase/vendor_reviews";

export interface VendorReviewCardProps {
  review: VendorReviewItem;
  onOpenDetailModal: (review: VendorReviewItem) => void;
  onReportReview: (reviewId: string) => void;
}

export function VendorReviewCard({
  review,
  onOpenDetailModal,
  onReportReview,
}: VendorReviewCardProps) {
  const [imgError, setImgError] = useState(false);

  const stars = Array.from({ length: 5 }, (_, i) => i < review.rating);

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface-elevated p-5 backdrop-blur-md transition-all hover:border-primary/40 shadow-lg">
      <div className="flex flex-col gap-3">
        {/* Top Row: Stars & Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-amber-400">
            {stars.map((filled, idx) => (
              <span key={idx} className="material-symbols-outlined text-[18px]">
                {filled ? "star" : "star_outline"}
              </span>
            ))}
            <span className="ml-1 font-display font-bold text-caption text-foreground">
              {review.rating}.0
            </span>
          </div>

          <span className="text-[11px] text-faint font-mono">
            {new Date(review.createdAtIso).toLocaleDateString([], {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Dish Info & Order Reference */}
        {review.menuItemName && (
          <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/50 p-2.5">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-black border border-border">
              {!imgError && review.menuItemImageUrl ? (
                <Image
                  src={review.menuItemImageUrl}
                  alt={review.menuItemName}
                  fill
                  onError={() => setImgError(true)}
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">fastfood</span>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-body-sm text-foreground">
                {review.menuItemName}
              </span>
              <span className="text-[11px] text-faint">
                Order #{review.orderNumber}
              </span>
            </div>
          </div>
        )}

        {/* Review Text */}
        <p className="text-body-sm text-foreground/90 line-clamp-3">
          "{review.reviewText || "No written review text provided."}"
        </p>

        {/* Existing Vendor Reply Box */}
        {review.vendorReply && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-caption">
            <span className="font-display font-bold text-primary block mb-0.5">
              Your Response:
            </span>
            <p className="text-foreground/90 italic line-clamp-2">
              "{review.vendorReply}"
            </p>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
        <span className="text-[11px] text-muted font-display font-bold">
          {review.vendorReply ? "✓ Responded" : "Needs Response"}
        </span>

        <div className="flex items-center gap-2">
          {review.reportStatus === "none" && (
            <button
              type="button"
              onClick={() => onReportReview(review.id)}
              className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger transition-colors"
              title="Report inappropriate review to admin"
            >
              <span className="material-symbols-outlined text-[18px]">flag</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenDetailModal(review)}
            className="flex items-center gap-1 rounded-xl bg-primary/10 border border-primary/30 px-3 py-1.5 font-display text-caption font-bold text-primary hover:bg-primary hover:text-on-primary transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">reply</span>
            {review.vendorReply ? "View Details" : "Reply"}
          </button>
        </div>
      </div>
    </div>
  );
}
