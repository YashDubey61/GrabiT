"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Floating "View Cart" CTA — glass surface per GRABIT_DESIGN.md, shown
 * above the bottom nav whenever the shared cart (useCart()) has items.
 * Features a far-right subtle circular dismiss button (X) to hide the floating summary
 * without modifying or clearing cart state.
 */
export function CartBar({
  canteenName,
  itemCount,
  total,
  visible = true,
  isDifferentVendor = false,
}: {
  canteenName: string;
  itemCount: number;
  total: number;
  /** Controls the enter/exit transition — the component stays mounted so
   * it can animate out instead of vanishing instantly at itemCount 0. */
  visible?: boolean;
  /** Set to true when viewing a vendor page that doesn't match the current cart's vendor */
  isDifferentVendor?: boolean;
}) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Automatically show the cart bar again if the student adds an item
  // or updates the cart while on screen.
  useEffect(() => {
    setIsDismissed(false);
  }, [itemCount, total, canteenName]);

  const isBarVisible = visible && !isDismissed;

  return (
    <div
      aria-hidden={!isBarVisible}
      className={cn(
        "fixed inset-x-4 z-40 mx-auto max-w-md transition-all duration-300 ease-standard sm:inset-x-0 md:max-w-lg",
        "[bottom:calc(env(safe-area-inset-bottom)+5.5rem)]",
        isBarVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <div className="glass-card flex h-16 w-full items-center justify-between gap-2 px-3.5 shadow-2xl">
        <Link
          href="/customer/checkout"
          tabIndex={isBarVisible ? 0 : -1}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 py-2 transition-transform active:scale-[0.99]"
        >
          <div className="min-w-0 pr-1">
            <p className="truncate text-caption font-semibold text-muted">
              {isDifferentVendor
                ? `Cart from another vendor (${canteenName})`
                : `${itemCount} item${itemCount === 1 ? "" : "s"} · ${canteenName}`}
            </p>
            <p className="font-display text-body font-700 tabular-nums text-foreground">
              ₹{total.toFixed(2)}
            </p>
          </div>

          <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-2 font-display text-caption font-extrabold uppercase tracking-wide text-on-primary">
            View Cart
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              arrow_forward
            </span>
          </span>
        </Link>

        {/* X / Close Button — Tiny, subtle 24px circular control inside an accessible 44x44px touch target */}
        <button
          type="button"
          aria-label="Dismiss cart"
          tabIndex={isBarVisible ? 0 : -1}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsDismissed(true);
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-2 transition-all"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-muted/80 transition-colors hover:bg-white/20 hover:text-foreground active:scale-95">
            <span className="material-symbols-outlined text-[13px] leading-none" aria-hidden="true">
              close
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
