"use client";

import { useState } from "react";
import { PromoCodeBrowseSheet } from "@/components/student/PromoCodeBrowseSheet";

export interface AppliedPromo {
  codeType: "PROMO" | "REWARD";
  promoCodeId?: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FLAT" | "REWARD";
  discountAmount: number;
}

interface PromoCodeSectionProps {
  canteenId: string;
  items: { menuItemId: string; quantity: number }[];
  applied: AppliedPromo | null;
  onApplied: (promo: AppliedPromo) => void;
  onRemove: () => void;
}

/** "Have a promo code?" checkout section — input + Apply, View Promo
 * Codes bottom sheet, and the applied-code state with a Remove
 * affordance. The discount shown here is always the server-validated
 * amount from /api/promo-codes/preview — never computed client-side. */
export function PromoCodeSection({ canteenId, items, applied, onApplied, onRemove }: PromoCodeSectionProps) {
  const [codeInput, setCodeInput] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);

  const applyCode = async (code: string) => {
    if (!code.trim()) {
      setError("Enter a promo code.");
      return;
    }
    setIsApplying(true);
    setError(null);
    try {
      const res = await fetch("/api/promo-codes/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), canteenId, items }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Couldn't apply this promo code.");
        return;
      }
      onApplied({
        codeType: data.codeType,
        promoCodeId: data.promoCodeId,
        code: data.code,
        description: data.description,
        discountType: data.discountType,
        discountAmount: data.discountAmount,
      });
      setCodeInput("");
      setIsBrowseOpen(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <section className="glass-card p-4">
      <h2 className="mb-3 flex items-center gap-2 text-label font-700 uppercase tracking-[0.08em] text-muted">
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
          sell
        </span>
        Have a promo code?
      </h2>

      {applied ? (
        <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate font-display text-body-sm font-800 text-primary">
              {applied.code}
              {applied.codeType === "REWARD" && <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase">Reward</span>}
            </p>
            <p className="text-[11px] text-muted">
              {applied.codeType === "REWARD" ? applied.description : null}
              {applied.codeType === "REWARD" && applied.description ? " · " : ""}
              − ₹{applied.discountAmount.toFixed(2)} applied
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded-lg border border-border-subtle px-2.5 py-1 text-[11px] font-bold text-muted hover:text-danger"
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="min-w-0 flex-1 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-body-sm font-bold uppercase tracking-wide text-foreground placeholder:text-muted placeholder:normal-case placeholder:tracking-normal focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              disabled={isApplying}
              onClick={() => applyCode(codeInput)}
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 font-display text-caption font-bold text-on-primary disabled:opacity-50"
            >
              {isApplying ? "Applying…" : "Apply"}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-faint">Promo codes and 16-digit reward codes both work here.</p>
          {error && <p className="mt-2 text-[11px] text-danger">{error}</p>}
          <button
            type="button"
            onClick={() => setIsBrowseOpen(true)}
            className="mt-2 flex items-center gap-1 text-caption font-700 text-primary"
          >
            View Promo Codes
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
              chevron_right
            </span>
          </button>
        </>
      )}

      <PromoCodeBrowseSheet
        isOpen={isBrowseOpen}
        onClose={() => setIsBrowseOpen(false)}
        onApply={applyCode}
        isApplying={isApplying}
      />
    </section>
  );
}
