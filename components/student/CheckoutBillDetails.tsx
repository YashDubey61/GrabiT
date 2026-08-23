"use client";

import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

/** Bottom-sheet "View Breakup" content — a real expand/collapse sheet,
 * not an anchor-scroll to a section that was already on screen.
 * GRABIT does not charge delivery, so no delivery-charge row is shown
 * — only Item Subtotal, Platform Fee (₹0 or ₹2.50), and Total. */
export function CheckoutBillDetails({
  subtotal,
  promoCode,
  discount,
  discountLabel = "Promo Discount",
  platformFee,
  total,
  isOpen,
  onClose,
}: {
  subtotal: number;
  promoCode?: string | null;
  discount?: number;
  discountLabel?: string;
  platformFee: number;
  total: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-drawer w-full max-w-2xl animate-in slide-in-from-bottom-4 fade-in duration-200 p-6 pb-[max(1.5rem,var(--safe-area-inset-bottom))] md:px-16">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-body font-800 text-foreground">Bill Details</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close breakup"
            className="rounded-lg p-1 text-faint hover:bg-surface hover:text-foreground"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-caption text-muted">
            <span>Item Subtotal</span>
            <span className="tabular-nums">₹{subtotal.toFixed(2)}</span>
          </div>
          {discount !== undefined && discount > 0 && (
            <div className="flex justify-between text-caption text-success">
              <span>{discountLabel} {promoCode ? `(${promoCode})` : ""}</span>
              <span className="tabular-nums">− ₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-caption text-muted">
            <span>Platform Fee</span>
            <span className="tabular-nums">₹{platformFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-border-subtle pt-3 text-body font-700 text-foreground">
            <span>Total</span>
            <span className="tabular-nums text-primary">₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
