"use client";

import { useRouter } from "next/navigation";

/**
 * Compact, clickable "Campus Leaders" entry for the Rewards page — the
 * full leaderboard lives at its own route (Campus Leaders is a distinct
 * view, not duplicated inline), matching the same card style as the
 * rest of the Rewards page.
 */
export function CampusLeadersCard({ topRank }: { topRank: number | null }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/customer/rewards/leaders")}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-elevated p-5 text-left transition-colors hover:border-primary/40 active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[22px]">
          🏆
        </span>
        <div>
          <p className="font-display text-body font-800 text-foreground">Campus Leaders</p>
          <p className="text-caption text-muted">
            {topRank != null ? `You're #${topRank} on campus` : "See who's leading this campus"}
          </p>
        </div>
      </div>
      <span className="material-symbols-outlined shrink-0 text-muted" aria-hidden="true">
        chevron_right
      </span>
    </button>
  );
}
