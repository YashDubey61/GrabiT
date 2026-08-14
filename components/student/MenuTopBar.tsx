"use client";

import { useRouter } from "next/navigation";

/**
 * Client component only for the back button (needs router history).
 * Search/info buttons are decorative for Day 2 — no menu-item search or
 * canteen-info modal exists yet, so they render but don't fake a result.
 */
export function MenuTopBar({ title }: { title: string }) {
  const router = useRouter();

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between bg-background px-5 md:px-16">
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.back()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/5 bg-surface-elevated text-foreground transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_back
          </span>
        </button>
        <h1 className="truncate font-display text-heading font-700 tracking-tight text-foreground">
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label="Search this menu"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-surface-elevated text-foreground transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            search
          </span>
        </button>
        <button
          type="button"
          aria-label="Canteen information"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-surface-elevated text-foreground transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            info
          </span>
        </button>
      </div>
    </header>
  );
}
