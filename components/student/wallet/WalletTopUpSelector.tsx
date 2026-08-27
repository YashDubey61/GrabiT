"use client";

import { useState } from "react";
import { calculateWalletTopupBonus } from "@/lib/pricing/wallet_topup";
import { openCashfreeCheckout } from "@/lib/payments/cashfree_client";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import { useModalBackHandler } from "@/lib/navigation/backButtonManager";

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

type Step = "input" | "processing" | "success" | "cancelled" | "failed" | "dropped";

interface WalletTopUpSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called once the top-up is verified SUCCESS server-side. */
  onTopUpSuccess: () => void;
}

export function WalletTopUpSelector({ isOpen, onClose, onTopUpSuccess }: WalletTopUpSelectorProps) {
  const [amountInput, setAmountInput] = useState("500");
  const [step, setStep] = useState<Step>("input");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successDetails, setSuccessDetails] = useState<{ amount: number; txId: string; totalCredit: number } | null>(null);

  useBodyScrollLock(isOpen);

  const reset = () => {
    setAmountInput("500");
    setStep("input");
    setIsSubmitting(false);
    setErrorMessage(null);
    setSuccessDetails(null);
  };

  const handleClose = () => {
    if (step === "success") {
      onTopUpSuccess();
    }
    reset();
    onClose();
  };

  // Register modal with Android hardware back-button coordinator
  useModalBackHandler(isOpen, handleClose, "wallet-topup-selector");

  if (!isOpen) return null;

  const amount = Number(amountInput);
  const isValidAmount = Number.isFinite(amount) && amount > 0;
  const preview = calculateWalletTopupBonus(isValidAmount ? amount : 0);

  const handleContinueToPay = async () => {
    if (!isValidAmount || isSubmitting) {
      if (!isValidAmount) setErrorMessage("Enter a valid amount.");
      return;
    }
    setIsSubmitting(true);
    setStep("processing");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/payments/cashfree/wallet-topup/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error ?? "Couldn't start top-up. Please try again.");
        setStep("failed");
        setIsSubmitting(false);
        return;
      }

      const checkoutRes = await openCashfreeCheckout(
        data.paymentSessionId,
        data.paymentMode === "PRODUCTION" ? "production" : "sandbox",
      );

      // Case 1: User aborted / cancelled checkout
      if (checkoutRes?.userCancelled) {
        setIsSubmitting(false);
        setStep("cancelled");
        return;
      }

      // Query server-authoritative status (Never trust client callback alone)
      let finalStatus = "PENDING";
      let confirmedCredit = amount;

      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          const statusRes = await fetch(`/api/payments/cashfree/wallet-topup/status?cashfreeOrderId=${data.cashfreeOrderId}`);
          const statusData = await statusRes.json();
          if (statusData.ok && statusData.status) {
            finalStatus = statusData.status;
            if (statusData.totalWalletCredit) {
              confirmedCredit = statusData.totalWalletCredit;
            }
            if (finalStatus === "SUCCESS" || finalStatus === "FAILED") {
              break;
            }
          }
        } catch {
          // Retry
        }
        await new Promise((r) => setTimeout(r, 1200));
      }

      setIsSubmitting(false);

      // Map to proper GRABIT UI state
      if (finalStatus === "SUCCESS") {
        setSuccessDetails({
          amount,
          txId: data.cashfreeOrderId,
          totalCredit: confirmedCredit,
        });
        setStep("success");
      } else if (finalStatus === "FAILED") {
        setStep("failed");
      } else {
        // Still pending or user left without completing
        setStep("dropped");
      }
    } catch {
      setIsSubmitting(false);
      setErrorMessage("Network error. Please try again.");
      setStep("failed");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-3 pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))] backdrop-blur-md transition-all sm:items-center sm:p-4 sm:pb-4">
      <div className="relative w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-3xl border border-border bg-surface-elevated p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 [::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-primary" aria-hidden="true">
              add_card
            </span>
            <h3 className="font-display text-title font-bold text-foreground">Add Money</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-faint hover:bg-surface hover:text-foreground"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        {/* INPUT STATE */}
        {step === "input" && (
          <>
            <label className="mb-1 block text-[11px] font-bold uppercase text-muted">Enter Amount</label>
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-4 py-3">
              <span className="font-display text-title font-bold text-foreground">₹</span>
              <input
                type="number"
                autoFocus
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="e.g. 100"
                className="w-full bg-transparent font-display text-title font-bold text-foreground focus:outline-none placeholder:text-muted"
              />
            </div>

            <div className="mb-4 grid grid-cols-5 gap-1.5">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmountInput(String(a))}
                  className={`rounded-xl border py-2 font-display text-caption font-bold transition-colors ${
                    amount === a ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted hover:border-white/20"
                  }`}
                >
                  ₹{a}
                </button>
              ))}
            </div>

            <div className="mb-4 rounded-xl border border-border-subtle bg-surface p-3.5">
              {preview.bonusUnlocked ? (
                <p className="mb-2 text-caption font-bold text-success">🎁 10% bonus unlocked</p>
              ) : (
                <p className="mb-2 text-caption text-muted">Add ₹500 or more and get 10% extra!</p>
              )}
              <div className="space-y-1.5 text-caption">
                <div className="flex justify-between text-muted">
                  <span>You Pay</span>
                  <span className="tabular-nums text-foreground">₹{preview.topupAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Bonus</span>
                  <span className={`tabular-nums ${preview.bonusAmount > 0 ? "text-success" : "text-foreground"}`}>
                    {preview.bonusAmount > 0 ? "+ " : ""}₹{preview.bonusAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border-subtle pt-1.5 font-bold text-foreground">
                  <span>Wallet Credit</span>
                  <span className="tabular-nums text-primary">₹{preview.totalWalletCredit.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {errorMessage && <p className="mb-3 text-center text-caption text-danger">{errorMessage}</p>}

            <button
              type="button"
              disabled={!isValidAmount || isSubmitting}
              onClick={handleContinueToPay}
              className="w-full rounded-xl bg-primary py-3 font-display text-body-sm font-bold text-on-primary shadow-lg hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
            >
              {isSubmitting ? "Opening Payment..." : "Continue to Pay"}
            </button>
          </>
        )}

        {/* PROCESSING STATE */}
        {step === "processing" && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="font-display text-body-sm font-semibold text-foreground">Connecting to Cashfree...</p>
            <p className="text-caption text-muted">Please complete the payment in the checkout window.</p>
          </div>
        )}

        {/* CASE 4: SUCCESSFUL PAYMENT */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="material-symbols-outlined text-[52px] text-success" aria-hidden="true">
              check_circle
            </span>
            <h4 className="font-display text-title font-bold text-foreground">Payment Successful</h4>
            <p className="text-body-sm text-foreground">
              <span className="font-bold text-primary">₹{successDetails?.totalCredit.toFixed(2)}</span> added to your GrabIt Wallet
            </p>
            {successDetails?.txId && (
              <p className="rounded-lg bg-surface px-3 py-1.5 font-mono text-[11px] text-muted">
                Transaction ID: {successDetails.txId}
              </p>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="mt-3 w-full rounded-xl bg-primary py-3 font-display text-body-sm font-bold text-on-primary shadow-lg hover:opacity-90 active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        )}

        {/* CASE 1: USER PRESSES BACK / CANCELS */}
        {step === "cancelled" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="material-symbols-outlined text-[48px] text-muted" aria-hidden="true">
              cancel
            </span>
            <h4 className="font-display text-title font-bold text-foreground">Payment Cancelled</h4>
            <p className="text-caption text-muted">
              Your payment was cancelled. No amount has been added to your wallet.
            </p>
            <div className="mt-3 flex w-full flex-col gap-2">
              <button
                type="button"
                onClick={reset}
                className="w-full rounded-xl bg-primary py-3 font-display text-body-sm font-bold text-on-primary shadow-lg hover:opacity-90 active:scale-[0.98]"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-xl border border-border bg-surface py-3 font-display text-caption font-bold text-muted hover:bg-surface-elevated hover:text-foreground"
              >
                Back to Wallet
              </button>
            </div>
          </div>
        )}

        {/* CASE 2: PAYMENT FAILURE */}
        {step === "failed" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="material-symbols-outlined text-[48px] text-danger" aria-hidden="true">
              error
            </span>
            <h4 className="font-display text-title font-bold text-danger">Payment Failed</h4>
            <p className="text-caption text-muted">
              {errorMessage || "We couldn't complete your payment. No amount has been added to your wallet."}
            </p>
            <div className="mt-3 flex w-full flex-col gap-2">
              <button
                type="button"
                onClick={reset}
                className="w-full rounded-xl bg-primary py-3 font-display text-body-sm font-bold text-on-primary shadow-lg hover:opacity-90 active:scale-[0.98]"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-xl border border-border bg-surface py-3 font-display text-caption font-bold text-muted hover:bg-surface-elevated hover:text-foreground"
              >
                Back to Wallet
              </button>
            </div>
          </div>
        )}

        {/* CASE 3: PAYMENT NOT COMPLETED / DROPPED */}
        {step === "dropped" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="material-symbols-outlined text-[48px] text-amber-500" aria-hidden="true">
              pending
            </span>
            <h4 className="font-display text-title font-bold text-foreground">Payment Not Completed</h4>
            <p className="text-caption text-muted">
              Your payment was not completed. If any amount was debited, it will be handled according to the payment status.
            </p>
            <div className="mt-3 flex w-full flex-col gap-2">
              <button
                type="button"
                onClick={reset}
                className="w-full rounded-xl bg-primary py-3 font-display text-body-sm font-bold text-on-primary shadow-lg hover:opacity-90 active:scale-[0.98]"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-xl border border-border bg-surface py-3 font-display text-caption font-bold text-muted hover:bg-surface-elevated hover:text-foreground"
              >
                Back to Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
