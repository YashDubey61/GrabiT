"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Floating "View Cart" CTA — glass surface per GRABIT_DESIGN.md, shown
 * above the bottom nav whenever the shared cart (useCart()) has items.
 * Reused as-is on both the Menu screen and the Student Dashboard so
 * there's exactly one cart-summary component, not two.
 */
export function CartBar({
  canteenName,
  itemCount,
  total,
  visible = true,
}: {
  canteenName: string;
  itemCount: number;
  total: number;
  /** Controls the enter/exit transition — the component stays mounted so
   * it can animate out instead of vanishing instantly at itemCount 0. */
  visible?: boolean;
}) {
  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-5 z-40 mx-auto max-w-md transition-all duration-300 ease-standard md:inset-x-16 md:max-w-lg",
        "[bottom:calc(env(safe-area-inset-bottom)+6rem)]",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <Link
        href="/customer/checkout"
        tabIndex={visible ? 0 : -1}
        className="glass-card flex h-16 w-full items-center justify-between gap-3 px-4 transition-transform active:scale-[0.98]"
      >
        <div className="min-w-0">
          <p className="truncate text-caption font-semibold text-muted">
            {itemCount} item{itemCount === 1 ? "" : "s"} · {canteenName}
          </p>
          <p className="font-display text-body font-700 tabular-nums text-foreground">
            ₹{total}
          </p>
        </div>

        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 font-display text-caption font-extrabold uppercase tracking-wide text-on-primary">
          View Cart
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            arrow_forward
          </span>
        </span>
      </Link>
    </div>
  );
}
