"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/lib/rewards/types";

/**
 * Dedicated Campus Leaders view. Deliberately shows only avatar,
 * GRABIT ID, and points per row — never full name, email, phone, or
 * any other profile data. Reads the same leaderboard API/data as the
 * compact card on the Rewards page (single source of truth).
 */
export default function CampusLeadersPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [period, setPeriod] = useState<LeaderboardPeriod>("alltime");
  const [isLoading, setIsLoading] = useState(true);

  const loadLeaderboard = useCallback(async (p: LeaderboardPeriod) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/student/rewards/leaderboard?period=${p}`);
      const data = await res.json();
      if (data.ok) {
        setEntries(data.entries);
        setCurrentUserRank(data.currentUserRank);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLeaderboard(period);
  }, [period, loadLeaderboard]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 w-full max-w-2xl items-center gap-3 px-4 sm:px-6 md:px-16">
          <button
            type="button"
            aria-label="Back to Rewards"
            onClick={() => router.push("/customer/rewards")}
            className="-ml-1 flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-elevated hover:text-foreground active:scale-95"
          >
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
              arrow_back
            </span>
          </button>
          <h1 className="font-display text-heading font-800 tracking-tight text-foreground">
            🏆 Campus Leaders
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-24 pt-6 md:px-16 md:pt-8">
        <div className="mb-4 flex justify-center gap-1 rounded-lg border border-border-subtle p-0.5">
          {(["weekly", "monthly", "alltime"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`flex-1 rounded-md px-3 py-1.5 text-caption font-bold capitalize ${
                period === p ? "bg-primary text-on-primary" : "text-muted"
              }`}
            >
              {p === "alltime" ? "All Time" : p}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-2">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-surface" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="p-6 text-center text-caption text-muted">No leaderboard activity yet.</p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                  entry.isCurrentUser ? "bg-primary/10" : ""
                }`}
              >
                <span className="w-5 shrink-0 text-caption font-bold text-muted">{entry.rank}</span>
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface">
                  <Image
                    src={entry.avatarUrl}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-body-sm font-bold text-foreground">
                  {entry.grabitUserId ?? "—"}
                </span>
                <span className="shrink-0 text-caption font-bold text-primary">
                  {(Number.isFinite(entry.points) ? entry.points : 0).toLocaleString()} pts
                </span>
              </div>
            ))
          )}
          {currentUserRank != null && !entries.some((e) => e.isCurrentUser) && (
            <div className="mt-1 flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2.5">
              <span className="text-body-sm font-bold text-foreground">Your Rank</span>
              <span className="text-caption font-bold text-primary">#{currentUserRank}</span>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
