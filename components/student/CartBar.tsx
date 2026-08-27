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
        "[bottom:calc(var(--safe-area-inset-bottom)+5.5rem)]",
        isBarVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <div className="relative flex h-16 w-full items-center justify-between gap-2 rounded-full border border-white/[0.14] bg-[#0c0c0e]/90 px-4 shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(255,122,0,0.12)] backdrop-blur-2xl">
        <Link
          href="/customer/checkout"
          tabIndex={isBarVisible ? 0 : -1}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 py-2 transition-transform active:scale-[0.99] cursor-pointer"
        >
          <div className="min-w-0 pr-1">
            <p className="truncate text-[11px] font-semibold text-zinc-400">
              {isDifferentVendor
                ? `Cart from another vendor (${canteenName})`
                : `${itemCount} item${itemCount === 1 ? "" : "s"} · ${canteenName}`}
            </p>
            <p className="font-display text-body font-extrabold tabular-nums text-white">
              ₹{total.toFixed(2)}
            </p>
          </div>

          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-display text-caption font-extrabold uppercase tracking-wide text-black shadow-[0_2px_12px_rgba(255,122,0,0.45)] hover:bg-primary-soft transition-all">
            View Cart
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              arrow_forward
            </span>
          </span>
        </Link>

        {/* X / Close Button */}
        <button
          type="button"
          aria-label="Dismiss cart"
          tabIndex={isBarVisible ? 0 : -1}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsDismissed(true);
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-2 transition-all cursor-pointer"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-zinc-400 transition-colors hover:bg-white/20 hover:text-white active:scale-95">
            <span className="material-symbols-outlined text-[13px] leading-none" aria-hidden="true">
              close
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
