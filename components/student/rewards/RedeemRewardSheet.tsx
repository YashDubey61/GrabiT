"use client";

import { useState } from "react";
import type { RewardCatalogItem, FriendSearchResult } from "@/lib/rewards/types";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

type Step = "choice" | "select-friend" | "confirm" | "success" | "error";

export function RedeemRewardSheet({
  reward,
  currentBalance,
  onClose,
  onSuccess,
  forceGiftMode = false,
  onShowMyRewards,
}: {
  reward: RewardCatalogItem;
  currentBalance: number;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
  /** "Gift Food" quick action jumps straight to friend-selection. */
  forceGiftMode?: boolean;
  onShowMyRewards?: () => void;
}) {
  // Mounted only while open (parent conditionally renders it), so the
  // lock is unconditional for the component's lifetime, not gated on a
  // prop.
  useBodyScrollLock(true);

  const [step, setStep] = useState<Step>(forceGiftMode ? "select-friend" : reward.isGiftable ? "choice" : "confirm");
  const [isGift, setIsGift] = useState(forceGiftMode);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recipient, setRecipient] = useState<FriendSearchResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultBalance, setResultBalance] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [redemptionCode, setRedemptionCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const insufficientPoints = currentBalance < reward.pointsCost;

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/student/friends/search?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setResults(data.ok ? data.results : []);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/student/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardId: reward.id,
          giftToUserId: isGift ? recipient?.userId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error ?? "We couldn't complete this redemption. Your points were not deducted.");
        setStep("error");
        return;
      }
      setResultBalance(data.balance);
      setOrderNumber(data.orderNumber ?? null);
      setRedemptionCode(data.redemptionCode ?? null);
      setExpiresAt(data.expiresAt ?? null);
      onSuccess(data.balance);
      setStep("success");
    } catch {
      setErrorMessage("Network error. Your points were not deducted.");
      setStep("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 backdrop-blur-md p-3 pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))] transition-all sm:items-center sm:p-4 sm:pb-4">
      <div className="relative w-full max-w-md max-h-[80dvh] overflow-y-auto rounded-3xl border border-border bg-surface-elevated p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 [::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-body font-800 text-foreground">{reward.name}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-faint hover:text-foreground">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {step === "choice" && (
          <div className="flex flex-col gap-3">
            <p className="text-caption text-muted">{reward.pointsCost.toLocaleString()} points</p>
            {insufficientPoints && (
              <p className="rounded-xl bg-danger-soft/60 p-3 text-caption text-danger">
                You need {(reward.pointsCost - currentBalance).toLocaleString()} more points to redeem this reward.
              </p>
            )}
            <button
              type="button"
              disabled={insufficientPoints}
              onClick={() => {
                setIsGift(false);
                setStep("confirm");
              }}
              className="w-full rounded-xl bg-primary py-3 font-display text-caption font-bold text-on-primary disabled:opacity-40"
            >
              Redeem for Myself
            </button>
            <button
              type="button"
              disabled={insufficientPoints}
              onClick={() => {
                setIsGift(true);
                setStep("select-friend");
              }}
              className="w-full rounded-xl border border-primary/40 py-3 font-display text-caption font-bold text-primary disabled:opacity-40"
            >
              Gift to Friend
            </button>
          </div>
        )}

        {step === "select-friend" && (
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or GRABIT ID"
              className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-3 text-body-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
            />
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {isSearching && <p className="py-4 text-center text-caption text-muted">Searching...</p>}
              {!isSearching && query.trim().length >= 2 && results.length === 0 && (
                <p className="py-4 text-center text-caption text-muted">No students found.</p>
              )}
              {results.map((r) => (
                <button
                  key={r.userId}
                  type="button"
                  onClick={() => {
                    setRecipient(r);
                    setStep("confirm");
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-caption font-bold text-primary">
                    {r.displayName.charAt(0).toUpperCase()}
                  </span>
                  <p className="truncate font-display text-body-sm font-bold text-foreground">{r.displayName}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="flex flex-col gap-4">
            <p className="text-center text-body-sm text-foreground">
              {isGift ? (
                <>
                  Gift <span className="font-800 text-primary">{reward.name}</span> to{" "}
                  <span className="font-800">{recipient?.displayName}</span>?
                </>
              ) : (
                <>
                  Redeem <span className="font-800 text-primary">{reward.name}</span> for{" "}
                  {reward.pointsCost.toLocaleString()} points?
                </>
              )}
            </p>
            <div className="flex flex-col gap-2 rounded-xl bg-surface p-3 text-caption">
              <div className="flex justify-between">
                <span className="text-muted">Current balance</span>
                <span className="font-bold text-foreground">{currentBalance.toLocaleString()} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Balance after</span>
                <span className="font-bold text-foreground">
                  {(currentBalance - reward.pointsCost).toLocaleString()} pts
                </span>
              </div>
            </div>
            {errorMessage && <p className="text-center text-caption text-danger">{errorMessage}</p>}
            <button
              type="button"
              disabled={isSubmitting || currentBalance < reward.pointsCost}
              onClick={handleConfirm}
              className="w-full rounded-xl bg-primary py-3 font-display text-caption font-bold text-on-primary disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
              <span className="material-symbols-outlined text-[32px]">
                {isGift ? "redeem" : "celebration"}
              </span>
            </span>
            <p className="font-display text-body font-800 text-foreground">
              {isGift ? "Gift sent! 🎁" : "🎁 Reward Unlocked"}
            </p>
            <p className="text-caption text-muted">
              {isGift
                ? `${reward.name} sent to ${recipient?.displayName}.`
                : `${reward.name} · ${reward.pointsCost.toLocaleString()} Points`}
            </p>
            {orderNumber && (
              <p className="text-[11px] text-muted">
                Order {orderNumber} created — track it in Orders.
              </p>
            )}

            {!isGift && redemptionCode && (
              <div className="my-2 w-full rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted">Show this code at the vendor</p>
                <p className="font-mono text-heading-sm font-900 tracking-[0.08em] text-primary">
                  {redemptionCode.replace(/(\d{4})(?=\d)/g, "$1 ")}
                </p>
                {expiresAt && (
                  <p className="mt-1 text-[11px] text-muted">
                    Valid until {new Date(expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(redemptionCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/40 py-2 font-display text-caption font-bold text-primary"
                >
                  <span className="material-symbols-outlined text-[16px]">{copied ? "check" : "content_copy"}</span>
                  {copied ? "Copied!" : "Copy Code"}
                </button>
              </div>
            )}

            {resultBalance !== null && (
              <p className="text-[11px] text-muted">New balance: {resultBalance.toLocaleString()} pts</p>
            )}
            <div className="flex w-full flex-col gap-2">
              {!isGift && redemptionCode && onShowMyRewards && (
                <button
                  type="button"
                  onClick={onShowMyRewards}
                  className="w-full rounded-xl border border-border-subtle py-3 font-display text-caption font-bold text-foreground"
                >
                  Show My Rewards
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-primary py-3 font-display text-caption font-bold text-on-primary"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
              <span className="material-symbols-outlined text-[32px]">error</span>
            </span>
            <p className="font-display text-body font-800 text-foreground">Something went wrong</p>
            <p className="text-caption text-muted">{errorMessage}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-xl border border-border-subtle py-3 font-display text-caption font-bold text-muted"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
