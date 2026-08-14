"use client";

import Image from "next/image";
import Link from "next/link";
import type { MockCanteen } from "@/lib/mock/campus";

/**
 * A client component only because of the quick-add button, which must
 * stop its click from also triggering the card's own navigation. The
 * card's primary action (view the canteen's menu) is a real `<Link>`,
 * not a client-side `router.push` from a `<div onClick>` — keyboard and
 * screen-reader users get a real link, not a div pretending to be one.
 *
 * Day 2 scope note: every canteen currently links to the single
 * `/student/menu` route (that's the only Menu route Day 1 built). A
 * canteen-scoped `/student/menu/[canteenId]` is Day 3+ work — see the
 * Day 2 report's recommendation.
 */
export function CanteenCard({ canteen }: { canteen: MockCanteen }) {
  return (
    <Link
      href="/student/menu"
      className="group relative block overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated transition-colors duration-300 hover:border-primary/50"
    >
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 to-transparent" />
        <Image
          src={canteen.image}
          alt={canteen.imageAlt}
          fill
          sizes="(min-width: 768px) 640px, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {canteen.trending && (
          <span className="absolute left-4 top-4 z-20 rounded-md bg-primary/90 px-3 py-1 text-label font-700 uppercase tracking-[0.04em] text-on-primary backdrop-blur-md">
            Trending
          </span>
        )}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
          <span
            className="material-symbols-outlined text-[20px] text-primary"
            aria-hidden="true"
          >
            schedule
          </span>
          <span className="text-caption font-700 text-white">
            {canteen.waitMinutes} mins wait
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between p-4">
        <div className="min-w-0">
          <h3 className="truncate font-display text-heading font-700 text-foreground">
            {canteen.name}
          </h3>
          <p className="mt-1 text-caption text-muted">{canteen.cuisineTags}</p>
          <div className="mt-2 flex items-center gap-1 text-primary">
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              star
            </span>
            <span className="text-label font-700">{canteen.rating}</span>
            <span className="ml-1 text-[10px] text-muted">
              ({canteen.ratingNote})
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-label={`Quick add from ${canteen.name}`}
          onClick={(e) => {
            // Quick-add is a Day 3+ cart feature (per canteen, before
            // opening the menu) — not implemented today. Prevented from
            // firing card navigation so the two affordances stay distinct,
            // but intentionally does nothing yet rather than faking a cart add.
            e.preventDefault();
            e.stopPropagation();
          }}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg transition-transform active:scale-90"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            add
          </span>
        </button>
      </div>
    </Link>
  );
}
