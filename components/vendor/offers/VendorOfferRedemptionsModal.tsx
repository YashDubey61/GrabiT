"use client";

import type { VendorOffer, OfferRedemptionLog } from "@/lib/supabase/vendor_offers";

export interface VendorOfferRedemptionsModalProps {
  offer: VendorOffer | null;
  isOpen: boolean;
  onClose: () => void;
  redemptions: OfferRedemptionLog[];
  isLoading?: boolean;
}

export function VendorOfferRedemptionsModal({
  offer,
  isOpen,
  onClose,
  redemptions,
  isLoading = false,
}: VendorOfferRedemptionsModalProps) {
  if (!isOpen || !offer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-title font-bold text-foreground">
                Redemptions: {offer.code}
              </h3>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-display text-caption font-bold text-primary">
                {redemptions.length} Uses
              </span>
            </div>
            <p className="text-caption text-muted">
              Total Discount Given: <span className="font-bold text-emerald-400">₹{offer.totalDiscountGiven}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-muted hover:bg-background hover:text-foreground"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted">
              <span className="material-symbols-outlined text-[24px] animate-spin mr-2">
                progress_activity
              </span>
              Loading redemptions...
            </div>
          ) : redemptions.length === 0 ? (
            <div className="rounded-2xl border border-border bg-background p-8 text-center text-caption text-muted">
              No redemptions recorded for this coupon code yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {redemptions.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-background/60 p-3"
                >
                  <div className="flex flex-col">
                    <span className="font-display text-body-sm font-bold text-foreground">
                      Order {r.orderNumber}
                    </span>
                    <span className="text-caption text-muted">{r.studentName}</span>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="font-display text-body-sm font-bold text-emerald-400">
                        -₹{r.discountAmount}
                      </span>
                      {r.orderTotal !== undefined && r.orderTotal > 0 && (
                        <span className="text-caption text-faint block font-mono">
                          Total: ₹{r.orderTotal}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-faint whitespace-nowrap">
                      {new Date(r.createdAtIso).toLocaleString([], {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-5 py-2.5 font-display text-caption font-bold text-muted hover:text-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
