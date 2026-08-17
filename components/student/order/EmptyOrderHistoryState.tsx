"use client";

import Link from "next/link";

export function EmptyOrderHistoryState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border border-white/10 bg-surface-container/60 p-8 text-center backdrop-blur-md">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <span className="material-symbols-outlined text-[36px]" aria-hidden="true">
          receipt_long
        </span>
      </div>

      <h2 className="mb-2 font-display text-title font-bold text-foreground">
        No Orders Yet
      </h2>

      <p className="mb-6 max-w-xs text-body-sm text-muted">
        You haven&apos;t placed any canteen orders yet. Browse your campus canteen menus to order food ahead of time!
      </p>

      <Link
        href="/customer/menu"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-display text-body font-bold uppercase tracking-wide text-on-primary shadow-lg transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
          restaurant_menu
        </span>
        Browse Menu
      </Link>
    </div>
  );
}
