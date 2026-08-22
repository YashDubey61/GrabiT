"use client";

import { useState } from "react";
import type { CanteenActiveOffer } from "@/lib/supabase/data";

function formatDiscountHeadline(offer: CanteenActiveOffer): string {
  const base =
    offer.discountType === "PERCENTAGE" ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`;
  const capSuffix =
    offer.discountType === "PERCENTAGE" && offer.maxDiscount ? ` (up to ₹${offer.maxDiscount})` : "";
  const minSuffix = offer.minOrderValue > 0 ? ` above ₹${offer.minOrderValue}` : "";
  return `${base}${minSuffix}${capSuffix}`;
}

/**
 * Vendor offers display board — student-facing. Reads the same
 * `promo_codes` rows Vendor Offers and checkout coupon validation use
 * (via getLiveCanteenActiveOffers), so there is one source of truth.
 * Renders nothing when the vendor has no active offers.
 */
export function VendorOffersBoard({ offers }: { offers: CanteenActiveOffer[] }) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (offers.length === 0) {
    return null;
  }

  const headlineOffer = offers[0];

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Clipboard access can be blocked (permissions/insecure context) —
      // the code is still visible on screen for the student to type manually.
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsSheetOpen(true)}
        className="mb-6 flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-left transition-colors hover:bg-primary/15"
      >
        <span className="material-symbols-outlined shrink-0 text-primary" aria-hidden="true">
          confirmation_number
        </span>
        <span className="min-w-0 flex-1 truncate text-body-sm font-700 text-foreground">
          {formatDiscountHeadline(headlineOffer)}
        </span>
        <span className="shrink-0 text-caption font-700 text-primary">
          {offers.length} offer{offers.length === 1 ? "" : "s"}
        </span>
        <span className="material-symbols-outlined shrink-0 text-[18px] text-primary" aria-hidden="true">
          chevron_right
        </span>
      </button>

      {isSheetOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
          <div className="glass-drawer max-h-[70vh] w-full max-w-md overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-body font-800 text-foreground">Available Offers</h3>
              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1 text-faint hover:bg-surface hover:text-foreground"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {offers.map((offer) => (
                <div key={offer.id} className="rounded-xl border border-border-subtle bg-surface p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-body-sm font-800 tracking-wide text-primary">
                        {offer.code}
                      </p>
                      <p className="mt-0.5 text-caption font-bold text-foreground">
                        {formatDiscountHeadline(offer)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(offer.code)}
                      className="shrink-0 rounded-lg bg-primary px-3 py-1.5 font-display text-[11px] font-bold text-on-primary transition-colors"
                    >
                      {copiedCode === offer.code ? "Code copied" : "Copy Code"}
                    </button>
                  </div>
                  {offer.description && (
                    <p className="mt-1.5 text-[11px] text-muted">{offer.description}</p>
                  )}
                  {offer.expiresAt && (
                    <p className="mt-1.5 text-[10px] text-faint">
                      Expires{" "}
                      {new Date(offer.expiresAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-[11px] text-faint">
              Apply your code at checkout — discount is verified there.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
