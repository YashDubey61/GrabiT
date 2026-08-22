"use client";

import { useEffect, useState } from "react";

interface PromoCodeListItem {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  maxDiscount: number | null;
  minOrderValue: number;
  expiresAt: string | null;
}

interface PromoCodeBrowseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (code: string) => void;
  isApplying: boolean;
}

function formatDiscount(p: PromoCodeListItem): string {
  if (p.discountType === "PERCENTAGE") {
    return p.maxDiscount ? `${p.discountValue}% off, up to ₹${p.maxDiscount}` : `${p.discountValue}% off`;
  }
  return `₹${p.discountValue} off`;
}

/** Compact bottom sheet listing every published + active promo code —
 * sized to sit comfortably within a 400×836 mobile viewport. */
export function PromoCodeBrowseSheet({ isOpen, onClose, onApply, isApplying }: PromoCodeBrowseSheetProps) {
  const [promoCodes, setPromoCodes] = useState<PromoCodeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    fetch("/api/promo-codes/active")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setPromoCodes(data.promoCodes);
      })
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="glass-drawer max-h-[70vh] w-full max-w-md overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-body font-800 text-foreground">Promo Codes</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-faint hover:bg-surface hover:text-foreground"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-caption text-muted">Loading promo codes…</p>
        ) : promoCodes.length === 0 ? (
          <p className="py-8 text-center text-caption text-muted">No promo codes available right now.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {promoCodes.map((p) => (
              <div key={p.id} className="rounded-xl border border-border-subtle bg-surface p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-body-sm font-800 tracking-wide text-primary">{p.code}</p>
                    <p className="mt-0.5 text-caption font-bold text-foreground">{formatDiscount(p)}</p>
                  </div>
                  <button
                    type="button"
                    disabled={isApplying}
                    onClick={() => onApply(p.code)}
                    className="shrink-0 rounded-lg bg-primary px-3 py-1.5 font-display text-[11px] font-bold text-on-primary disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
                {p.description && <p className="mt-1.5 text-[11px] text-muted">{p.description}</p>}
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-faint">
                  {p.minOrderValue > 0 && <span>Min. order ₹{p.minOrderValue}</span>}
                  {p.expiresAt && <span>Expires {new Date(p.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
