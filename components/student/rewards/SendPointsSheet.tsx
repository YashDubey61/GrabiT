"use client";

import { useState } from "react";
import type { FriendSearchResult } from "@/lib/rewards/types";
import { MIN_TRANSFER_AMOUNT, TRANSFER_STEP, validateTransferAmount } from "@/lib/rewards/points_rules";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

type Step = "select" | "amount" | "confirm" | "success" | "error";

export function SendPointsSheet({
  isOpen,
  onClose,
  currentBalance,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onSuccess: (newBalance: number) => void;
}) {
  const [step, setStep] = useState<Step>("select");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recipient, setRecipient] = useState<FriendSearchResult | null>(null);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultBalance, setResultBalance] = useState<number | null>(null);

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const reset = () => {
    setStep("select");
    setQuery("");
    setResults([]);
    setRecipient(null);
    setAmount("");
    setErrorMessage(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

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

  const numericAmount = Number(amount);
  const amountValidation = amount.trim() === "" ? null : validateTransferAmount(numericAmount, currentBalance);
  const canProceedAmount = amountValidation?.valid === true;

  const amountHintMessage =
    currentBalance < MIN_TRANSFER_AMOUNT
      ? "You need at least 100 points to send."
      : "Send points in multiples of 100.";

  const amountErrorMessage =
    amountValidation && !amountValidation.valid
      ? amountValidation.reason === "INSUFFICIENT_BALANCE"
        ? "You don't have enough points for this transfer."
        : amountValidation.reason === "BELOW_MINIMUM"
          ? "You need at least 100 points to send."
          : "Points can only be sent in multiples of 100."
      : null;

  const handleConfirm = async () => {
    if (!recipient) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/student/points/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: recipient.userId, amount: numericAmount }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error ?? "We couldn't complete the transfer. Your points were not deducted.");
        setStep("error");
        return;
      }
      setResultBalance(data.senderBalance);
      onSuccess(data.senderBalance);
      setStep("success");
    } catch {
      setErrorMessage("Network error. Your points were not deducted.");
      setStep("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl border border-border-subtle bg-surface-elevated p-6 pb-[max(1.5rem,var(--safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-body font-800 text-foreground">Send Points</h3>
          <button type="button" onClick={handleClose} aria-label="Close" className="text-faint hover:text-foreground">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {step === "select" && (
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
                    setStep("amount");
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-caption font-bold text-primary">
                    {r.displayName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-body-sm font-bold text-foreground">{r.displayName}</p>
                    {r.grabitUserId && <p className="truncate text-[11px] text-muted">{r.grabitUserId}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "amount" && recipient && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-caption font-bold text-primary">
                {recipient.displayName.charAt(0).toUpperCase()}
              </span>
              <p className="font-display text-body-sm font-bold text-foreground">{recipient.displayName}</p>
            </div>
            <div>
              <label className="mb-1 block text-caption font-bold text-muted">Points to send</label>
              <input
                autoFocus
                type="number"
                inputMode="numeric"
                min={MIN_TRANSFER_AMOUNT}
                step={TRANSFER_STEP}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 100"
                aria-invalid={amountErrorMessage !== null}
                className={`w-full rounded-xl border bg-surface px-3 py-3 text-body font-bold text-foreground placeholder:text-muted focus:outline-none ${
                  amountErrorMessage ? "border-danger focus:border-danger" : "border-border-subtle focus:border-primary"
                }`}
              />
              <p className={`mt-1 text-[11px] ${amountErrorMessage ? "text-danger" : "text-muted"}`}>
                {amountErrorMessage ?? amountHintMessage}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">Your balance: {currentBalance.toLocaleString()} pts</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("select")}
                className="flex-1 rounded-xl border border-border-subtle py-3 font-display text-caption font-bold text-muted"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!canProceedAmount}
                onClick={() => setStep("confirm")}
                className="flex-1 rounded-xl bg-primary py-3 font-display text-caption font-bold text-on-primary disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === "confirm" && recipient && (
          <div className="flex flex-col gap-4">
            <p className="text-center text-body-sm text-foreground">
              Send <span className="font-800 text-primary">{numericAmount.toLocaleString()} GRABIT Points</span> to{" "}
              <span className="font-800">{recipient.displayName}</span>?
            </p>
            <div className="flex flex-col gap-2 rounded-xl bg-surface p-3 text-caption">
              <div className="flex justify-between">
                <span className="text-muted">Current balance</span>
                <span className="font-bold text-foreground">{currentBalance.toLocaleString()} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Balance after transfer</span>
                <span className="font-bold text-foreground">{(currentBalance - numericAmount).toLocaleString()} pts</span>
              </div>
            </div>
            {errorMessage && <p className="text-center text-caption text-danger">{errorMessage}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("amount")}
                className="flex-1 rounded-xl border border-border-subtle py-3 font-display text-caption font-bold text-muted"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirm}
                className="flex-1 rounded-xl bg-primary py-3 font-display text-caption font-bold text-on-primary disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Confirm"}
              </button>
            </div>
          </div>
        )}

        {step === "success" && recipient && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </span>
            <p className="font-display text-body font-800 text-foreground">Points sent!</p>
            <p className="text-caption text-muted">
              {numericAmount.toLocaleString()} points sent to {recipient.displayName}.
            </p>
            {resultBalance !== null && (
              <p className="text-[11px] text-muted">New balance: {resultBalance.toLocaleString()} pts</p>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="mt-2 w-full rounded-xl bg-primary py-3 font-display text-caption font-bold text-on-primary"
            >
              Done
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
              <span className="material-symbols-outlined text-[32px]">error</span>
            </span>
            <p className="font-display text-body font-800 text-foreground">Transfer failed</p>
            <p className="text-caption text-muted">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setStep("confirm")}
              className="mt-2 w-full rounded-xl bg-primary py-3 font-display text-caption font-bold text-on-primary"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
