"use client";

import { useState } from "react";
import { calculateOrderPricing } from "@/lib/pricing/order_pricing";
import { CheckoutBillDetails } from "@/components/student/CheckoutBillDetails";

interface CheckoutActionProps {
  subtotal: number;
  promoCode?: string | null;
  discount?: number;
  discountLabel?: string;
  onPlaceOrder: () => void;
  error?: string | null;
  isSubmitting?: boolean;
}

export function CheckoutAction({
  subtotal,
  promoCode,
  discount = 0,
  discountLabel,
  onPlaceOrder,
  error,
  isSubmitting = false,
}: CheckoutActionProps) {
  const [isBreakupOpen, setIsBreakupOpen] = useState(false);

  // Display-only — the server independently recomputes and validates
  // every one of these numbers (including re-validating the promo code)
  // at order creation via the same calculateOrderPricing() function;
  // nothing here is trusted for payment. GRABIT does not charge
  // delivery (always ₹0).
  const pricing = calculateOrderPricing({ subtotal, discount });

  return (
    <>
      <CheckoutBillDetails
        subtotal={pricing.subtotal}
        promoCode={promoCode}
        discount={pricing.discount}
        discountLabel={discountLabel}
        platformFee={pricing.platformFee}
        total={pricing.totalPayable}
        isOpen={isBreakupOpen}
        onClose={() => setIsBreakupOpen(false)}
      />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface-elevated/90 p-5 pb-[max(1.25rem,var(--safe-area-inset-bottom))] backdrop-blur-md md:px-16">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col">
              <span className="text-label font-700 uppercase text-muted">
                Total Payable
              </span>
              <span className="font-display text-heading font-800 tabular-nums text-foreground">
                ₹{pricing.totalPayable.toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsBreakupOpen(true)}
              className="flex items-center gap-1 text-caption font-700 text-primary"
            >
              View Breakup
              <span className="material-symbols-outlined text-sm" aria-hidden="true">
                expand_less
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={onPlaceOrder}
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary py-4 text-body font-800 uppercase tracking-wide text-on-primary shadow-xl shadow-primary/20 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <span className="material-symbols-outlined animate-spin text-[20px]">
                progress_activity
              </span>
            )}
            <span>{isSubmitting ? "Processing..." : "Proceed to Pay"}</span>
          </button>

          {error && (
            <p role="alert" className="text-center text-caption font-semibold text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
