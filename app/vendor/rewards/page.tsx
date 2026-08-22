"use client";

import { useState } from "react";

type Step = "idle" | "verifying" | "verified" | "error" | "marking" | "done";

export default function VendorRewardsPage() {
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ rewardName: string; canteenName: string; pointsSpent: number } | null>(null);

  const digitsOnly = code.replace(/\D/g, "").slice(0, 16);

  const handleVerify = async () => {
    setStep("verifying");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/vendor/rewards/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: digitsOnly }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error ?? "Couldn't verify this code.");
        setStep("error");
        return;
      }
      setPreview({ rewardName: data.rewardName, canteenName: data.canteenName, pointsSpent: data.pointsSpent });
      setStep("verified");
    } catch {
      setErrorMessage("Network error verifying code.");
      setStep("error");
    }
  };

  const handleMarkUsed = async () => {
    setStep("marking");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/vendor/rewards/mark-used", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: digitsOnly }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error ?? "Couldn't redeem this code.");
        setStep("error");
        return;
      }
      setStep("done");
    } catch {
      setErrorMessage("Network error redeeming code.");
      setStep("error");
    }
  };

  const reset = () => {
    setCode("");
    setStep("idle");
    setErrorMessage(null);
    setPreview(null);
  };

  return (
    <main className="min-h-dvh bg-background p-4 pb-24 text-foreground md:p-8">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="font-display text-heading-lg font-900 text-foreground">Verify Reward Code</h1>
          <p className="mt-1 text-body-sm text-muted">Enter the 16-digit code the student shows you.</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface-elevated p-5">
          <input
            inputMode="numeric"
            autoFocus
            value={digitsOnly.replace(/(\d{4})(?=\d)/g, "$1 ")}
            onChange={(e) => setCode(e.target.value)}
            disabled={step === "verifying" || step === "verified" || step === "marking" || step === "done"}
            placeholder="0000 0000 0000 0000"
            className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-4 text-center font-mono text-heading-sm font-800 tracking-[0.06em] text-foreground placeholder:text-muted focus:border-primary focus:outline-none disabled:opacity-60"
          />

          {step === "idle" && (
            <button
              type="button"
              disabled={digitsOnly.length !== 16}
              onClick={handleVerify}
              className="mt-4 w-full rounded-xl bg-primary py-3 font-display text-caption font-bold text-on-primary disabled:opacity-40"
            >
              Verify Code
            </button>
          )}

          {step === "verifying" && (
            <p className="mt-4 text-center text-caption text-muted">Verifying…</p>
          )}

          {step === "verified" && preview && (
            <div className="mt-4 flex flex-col gap-3">
              <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-center">
                <p className="font-display text-body font-800 text-success">✅ Valid Reward</p>
                <p className="mt-1 font-display text-body-sm font-800 text-foreground">{preview.rewardName}</p>
                <p className="text-caption text-muted">{preview.canteenName}</p>
                <p className="mt-1 text-[11px] text-muted">{preview.pointsSpent.toLocaleString()} points</p>
              </div>
              <button
                type="button"
                onClick={handleMarkUsed}
                className="w-full rounded-xl bg-primary py-3 font-display text-caption font-bold text-on-primary"
              >
                Mark as Redeemed
              </button>
              <button type="button" onClick={reset} className="w-full rounded-xl border border-border-subtle py-3 font-display text-caption font-bold text-muted">
                Cancel
              </button>
            </div>
          )}

          {step === "marking" && <p className="mt-4 text-center text-caption text-muted">Redeeming…</p>}

          {step === "done" && (
            <div className="mt-4 flex flex-col gap-3 text-center">
              <p className="font-display text-body font-800 text-success">✅ Reward redeemed successfully.</p>
              <button type="button" onClick={reset} className="w-full rounded-xl bg-primary py-3 font-display text-caption font-bold text-on-primary">
                Verify Another Code
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="mt-4 flex flex-col gap-3 text-center">
              <p className="rounded-xl bg-danger-soft/60 p-3 text-caption text-danger">{errorMessage}</p>
              <button type="button" onClick={reset} className="w-full rounded-xl border border-border-subtle py-3 font-display text-caption font-bold text-muted">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
