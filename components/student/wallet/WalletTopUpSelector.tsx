"use client";

import { useState } from "react";
import { calculateWalletTopupBonus } from "@/lib/pricing/wallet_topup";
import { openCashfreeCheckout } from "@/lib/payments/cashfree_client";

const QUICK_AMOUNTS = [100, 500, 1000, 2000];

type Step = "input" | "processing" | "error";

interface WalletTopUpSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called once the top-up is verified SUCCESS server-side. */
  onTopUpSuccess: () => void;
}

export function WalletTopUpSelector({ isOpen, onClose, onTopUpSuccess }: WalletTopUpSelectorProps) {
  const [amountInput, setAmountInput] = useState("500");
  const [step, setStep] = useState<Step>("input");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const amount = Number(amountInput);
  const isValidAmount = Number.isFinite(amount) && amount > 0;
  const preview = calculateWalletTopupBonus(isValidAmount ? amount : 0);

  const reset = () => {
    setAmountInput("500");
    setStep("input");
    setErrorMessage(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleContinueToPay = async () => {
    if (!isValidAmount) {
      setErrorMessage("Enter a valid amount.");
      return;
    }
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
        setStep("error");
        return;
      }

      await openCashfreeCheckout(data.paymentSessionId, data.paymentMode === "PRODUCTION" ? "production" : "sandbox");

      // Poll for the webhook-verified status — never credit locally.
      let confirmed = false;
      for (let attempt = 0; attempt < 8 && !confirmed; attempt++) {
        const statusRes = await fetch(`/api/payments/cashfree/wallet-topup/status?cashfreeOrderId=${data.cashfreeOrderId}`);
        const statusData = await statusRes.json();
        if (statusData.ok && statusData.status === "SUCCESS") {
          confirmed = true;
          break;
        }
        if (statusData.ok && statusData.status === "FAILED") {
          setErrorMessage("Payment failed. Your wallet was not credited.");
          setStep("error");
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }

      if (confirmed) {
        onTopUpSuccess();
        handleClose();
      } else {
        setErrorMessage("Payment is still being confirmed. Check your wallet shortly.");
        setStep("error");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStep("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:pb-4">
      <div className="glass-modal w-full max-w-md max-h-[calc(100dvh-6rem)] overflow-y-auto p-5 animate-in fade-in slide-in-from-bottom-5">
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
            className="flex h-8 w-8 items-center justify-center rounded-lg text-faint hover:bg-surface-elevated hover:text-foreground"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        {step === "input" && (
          <>
            <label className="mb-1 block text-[11px] font-bold uppercase text-muted">Enter Amount</label>
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-elevated px-4 py-3">
              <span className="font-display text-title font-bold text-foreground">₹</span>
              <input
                type="number"
                autoFocus
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full bg-transparent font-display text-title font-bold text-foreground focus:outline-none"
              />
            </div>

            <div className="mb-4 flex gap-2">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmountInput(String(a))}
                  className={`flex-1 rounded-lg border py-1.5 font-display text-caption font-bold transition-colors ${
                    amount === a ? "border-primary bg-primary/10 text-primary" : "border-border text-muted hover:border-white/20"
                  }`}
                >
                  ₹{a}
                </button>
              ))}
            </div>

            <div className="mb-4 rounded-xl border border-border-subtle bg-surface-elevated p-3">
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
              disabled={!isValidAmount}
              onClick={handleContinueToPay}
              className="w-full rounded-xl bg-primary py-3 font-display text-body-sm font-bold text-on-primary shadow-lg hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
            >
              Continue to Pay
            </button>
          </>
        )}

        {step === "processing" && <p className="py-6 text-center text-caption text-muted">Processing your payment…</p>}

        {step === "error" && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-caption text-danger">{errorMessage}</p>
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-xl border border-border-subtle py-3 font-display text-caption font-bold text-muted"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
