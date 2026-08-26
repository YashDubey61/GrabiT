"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SendPointsSheet } from "@/components/student/rewards/SendPointsSheet";
import { RedeemRewardSheet } from "@/components/student/rewards/RedeemRewardSheet";
import { CampusLeadersCard } from "@/components/student/rewards/CampusLeadersCard";
import type {
  RewardAccountSummary,
  PointTransactionItem,
  RewardCatalogItem,
  FriendActivityItem,
} from "@/lib/rewards/types";

interface MyRewardRedemption {
  id: string;
  rewardName: string;
  pointsSpent: number;
  codeStatus: "GENERATED" | "USED" | "EXPIRED" | "CANCELLED" | "REJECTED";
  redemptionCode: string | null;
  expiresAt: string | null;
  redeemedAt: string | null;
  createdAt: string;
  isGiftReceived: boolean;
  usedOrderNumber: string | null;
}

const CODE_STATUS_LABEL: Record<MyRewardRedemption["codeStatus"], string> = {
  GENERATED: "Active",
  USED: "Used",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

const TX_ICON: Record<string, string> = {
  EARN: "restaurant",
  REDEEM: "redeem",
  SEND: "north_east",
  RECEIVE: "south_west",
  GIFT_BONUS: "auto_awesome",
  ADJUST: "tune",
};

const NOTIF_KIND_TEXT: Record<FriendActivityItem["kind"], (name: string, amount: number | null, reward: string | null) => string> = {
  SENT: (name, amount) => `You sent ${amount} pts to ${name}`,
  RECEIVED: (name, amount) => `${name} sent you ${amount} pts`,
  GIFT_SENT: (name, _amount, reward) => `You gifted ${reward} to ${name}`,
  GIFT_RECEIVED: (name, _amount, reward) => `${name} gifted you ${reward}`,
};

export default function StudentRewardsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<RewardAccountSummary | null>(null);
  const [history, setHistory] = useState<PointTransactionItem[]>([]);
  const [catalog, setCatalog] = useState<RewardCatalogItem[]>([]);
  const [friendActivity, setFriendActivity] = useState<FriendActivityItem[]>([]);
  const [myRewards, setMyRewards] = useState<MyRewardRedemption[]>([]);
  const [revealedCodeId, setRevealedCodeId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isSendOpen, setIsSendOpen] = useState(false);
  const [redeemTarget, setRedeemTarget] = useState<{ reward: RewardCatalogItem; forceGift: boolean } | null>(null);

  const loadCore = useCallback(async () => {
    const [summaryRes, historyRes, catalogRes] = await Promise.all([
      fetch("/api/student/rewards/summary").then((r) => r.json()),
      fetch("/api/student/rewards/history").then((r) => r.json()),
      fetch("/api/student/rewards/catalog").then((r) => r.json()),
    ]);
    if (summaryRes.ok) setSummary(summaryRes.summary);
    if (historyRes.ok) setHistory(historyRes.history);
    if (catalogRes.ok) setCatalog(catalogRes.catalog);
  }, []);

  const loadMyRewards = useCallback(async () => {
    const res = await fetch("/api/student/rewards/my-rewards").catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      if (data.ok) setMyRewards(data.redemptions);
    }
  }, []);

  const loadFriendActivity = useCallback(async () => {
    const res = await fetch("/api/student/rewards/friends-activity").catch(() => null);
    if (res && res.ok) {
      const data = await res.json();
      if (data.ok) setFriendActivity(data.activity);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await Promise.all([loadCore(), loadFriendActivity(), loadMyRewards()]);
      setIsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshAfterAction = (newBalance: number) => {
    setSummary((prev) => (prev ? { ...prev, pointsBalance: newBalance } : prev));
    loadCore();
    loadFriendActivity();
    loadMyRewards();
  };

  const foodRewards = catalog.filter((r) => r.rewardType === "FOOD_ITEM");

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 w-full max-w-2xl lg:max-w-5xl items-center gap-3 px-4 sm:px-6 md:px-16">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => router.back()}
            className="-ml-1 flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-elevated hover:text-foreground active:scale-95"
          >
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
              arrow_back
            </span>
          </button>
          <h1 className="font-display text-heading font-800 tracking-tight text-foreground">Rewards</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl lg:max-w-5xl space-y-6 px-5 pb-24 pt-6 md:px-16 md:pt-8">
        {/* Top Desktop Grid: Left (Points + Quick Actions) & Right (Campus Leaders) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column */}
          <div className="space-y-6">
            {/* 1. Points Balance Card */}
            <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-surface-elevated p-6 shadow-xl">
              <p className="text-label font-700 uppercase tracking-wide text-muted">GRABIT Points</p>
              {isLoading ? (
                <div className="mt-2 h-10 w-32 animate-pulse rounded-lg bg-surface" />
              ) : (
                <p className="font-display text-[40px] font-800 leading-tight text-foreground">
                  {(summary?.pointsBalance ?? 0).toLocaleString()}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted">
                <span className="text-success">+{summary?.earnedThisWeek ?? 0} this week</span>
                {summary?.rank != null && <span>#{summary.rank} on campus</span>}
              </div>

              {summary?.nextRewardName && (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-[11px] text-muted">
                    <span>Progress to {summary.nextRewardName}</span>
                    <span>{summary.nextRewardPointsCost} pts</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.round((summary.progressToNextReward ?? 0) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => catalog[0] && setRedeemTarget({ reward: catalog[0], forceGift: false })}
                  disabled={catalog.length === 0}
                  className="flex-1 rounded-xl bg-primary py-3 font-display text-caption font-bold text-on-primary disabled:opacity-40"
                >
                  Redeem
                </button>
                <button
                  type="button"
                  onClick={() => setIsSendOpen(true)}
                  className="flex-1 rounded-xl border border-primary/40 py-3 font-display text-caption font-bold text-primary"
                >
                  Send Points
                </button>
              </div>
            </section>

            {/* 2. Quick Actions */}
            <section className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => catalog[0] && setRedeemTarget({ reward: catalog[0], forceGift: false })}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border-subtle bg-surface-elevated py-4 text-center hover:border-primary/40"
              >
                <span className="material-symbols-outlined text-[24px] text-primary">redeem</span>
                <span className="text-caption font-bold text-foreground">Redeem</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSendOpen(true)}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border-subtle bg-surface-elevated py-4 text-center hover:border-primary/40"
              >
                <span className="material-symbols-outlined text-[24px] text-primary">send</span>
                <span className="text-caption font-bold text-foreground">Send Points</span>
              </button>
              <button
                type="button"
                onClick={() => foodRewards[0] && setRedeemTarget({ reward: foodRewards[0], forceGift: true })}
                disabled={foodRewards.length === 0}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border-subtle bg-surface-elevated py-4 text-center hover:border-primary/40 disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[24px] text-primary">fastfood</span>
                <span className="text-caption font-bold text-foreground">Gift Food</span>
              </button>
            </section>
          </div>

          {/* Right Column on desktop, stacks naturally below on mobile */}
          <div>
            <CampusLeadersCard topRank={summary?.rank ?? null} />
          </div>
        </div>

        {/* 3. Available Rewards */}
        <section>
          <h2 className="mb-3 font-display text-body font-800 text-foreground">Available Rewards</h2>
          {catalog.length === 0 ? (
            <p className="rounded-2xl border border-border-subtle bg-surface-elevated p-5 text-center text-caption text-muted">
              New rewards are coming soon.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {catalog.map((reward) => (
                <button
                  key={reward.id}
                  type="button"
                  onClick={() => setRedeemTarget({ reward, forceGift: false })}
                  disabled={!reward.available}
                  className="flex flex-col items-start gap-1 rounded-2xl border border-border-subtle bg-surface-elevated p-4 text-left transition-transform hover:border-primary/40 active:scale-[0.98] disabled:opacity-40"
                >
                  <span className="font-display text-caption font-800 text-primary">
                    {reward.pointsCost.toLocaleString()} pts
                  </span>
                  <span className="text-body-sm font-bold text-foreground">{reward.name}</span>
                  {reward.isGiftable && <span className="text-[10px] text-muted">Giftable</span>}
                  {!reward.available && <span className="text-[10px] text-danger">Out of stock</span>}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* My Rewards */}
        <section id="my-rewards">
          <h2 className="mb-3 font-display text-body font-800 text-foreground">My Rewards</h2>
          {myRewards.length === 0 ? (
            <p className="rounded-2xl border border-border-subtle bg-surface-elevated p-5 text-center text-caption text-muted">
              Redeem a reward to see your codes here.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {myRewards.map((r) => (
                <div key={r.id} className="glass-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-body-sm font-800 text-foreground">{r.rewardName}</p>
                      <p className="text-[11px] text-muted">
                        {r.pointsSpent.toLocaleString()} pts ·{" "}
                        {new Date(r.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        r.codeStatus === "GENERATED"
                          ? "bg-primary/10 text-primary"
                          : r.codeStatus === "USED"
                            ? "bg-success/10 text-success"
                            : "bg-surface text-muted"
                      }`}
                    >
                      {CODE_STATUS_LABEL[r.codeStatus]}
                    </span>
                  </div>

                  {r.codeStatus === "GENERATED" && r.redemptionCode && (
                    <div className="mt-3">
                      {revealedCodeId === r.id ? (
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-body font-900 tracking-[0.06em] text-primary">
                            {r.redemptionCode.replace(/(\d{4})(?=\d)/g, "$1 ")}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(r.redemptionCode!);
                              setCopiedId(r.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            aria-label="Copy code"
                            className="rounded-lg border border-border-subtle p-1.5 text-faint hover:text-primary"
                          >
                            <span className="material-symbols-outlined text-[16px]">{copiedId === r.id ? "check" : "content_copy"}</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRevealedCodeId(r.id)}
                          className="rounded-lg border border-primary/40 px-3 py-1.5 text-caption font-bold text-primary"
                        >
                          Show Code
                        </button>
                      )}
                      {r.expiresAt && (
                        <p className="mt-1 text-[10px] text-faint">
                          Valid until {new Date(r.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-faint">Enter this code in Checkout → Promo Code to redeem.</p>
                    </div>
                  )}
                  {r.codeStatus === "USED" && r.redeemedAt && (
                    <p className="mt-2 text-[11px] text-muted">
                      Used on {new Date(r.redeemedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                      {r.usedOrderNumber ? ` · Order ${r.usedOrderNumber}` : ""}
                    </p>
                  )}
                  {r.codeStatus === "EXPIRED" && (
                    <p className="mt-2 text-[11px] text-danger">Expired</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. Friends / Recent Gifts */}
        <section>
          <h2 className="mb-3 font-display text-body font-800 text-foreground">Recent Gifts</h2>
          {friendActivity.length === 0 ? (
            <p className="rounded-2xl border border-border-subtle bg-surface-elevated p-5 text-center text-caption text-muted">
              Invite your friends and start gifting.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {friendActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2.5"
                >
                  <span className="text-body-sm text-foreground">
                    {NOTIF_KIND_TEXT[item.kind](item.counterpartName, item.amount, item.rewardName)}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted">
                    {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 6. Points History */}
        <section>
          <h2 className="mb-3 font-display text-body font-800 text-foreground">Points History</h2>
          {history.length === 0 ? (
            <p className="rounded-2xl border border-border-subtle bg-surface-elevated p-5 text-center text-caption text-muted">
              Start ordering to earn your first GRABIT Points.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2.5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
                    <span className="material-symbols-outlined text-[16px]">{TX_ICON[tx.type] ?? "tune"}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm font-semibold text-foreground">
                      {tx.description}
                      {tx.relatedOrderNumber ? ` · ${tx.relatedOrderNumber}` : ""}
                      {tx.relatedUserName ? ` · ${tx.relatedUserName}` : ""}
                    </p>
                    <p className="text-[11px] text-muted">
                      {new Date(tx.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-display text-body-sm font-800 ${
                      tx.amount >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {tx.amount >= 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <SendPointsSheet
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
        currentBalance={summary?.pointsBalance ?? 0}
        onSuccess={refreshAfterAction}
      />

      {redeemTarget && (
        <RedeemRewardSheet
          reward={redeemTarget.reward}
          currentBalance={summary?.pointsBalance ?? 0}
          forceGiftMode={redeemTarget.forceGift}
          onClose={() => setRedeemTarget(null)}
          onSuccess={refreshAfterAction}
          onShowMyRewards={() => {
            setRedeemTarget(null);
            requestAnimationFrame(() => {
              document.getElementById("my-rewards")?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          }}
        />
      )}
    </>
  );
}
