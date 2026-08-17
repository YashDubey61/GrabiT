"use client";

import { useEffect, useState } from "react";
import { getMockPlatformFee } from "@/lib/cart/calculations";
import { CheckoutBillDetails } from "@/components/student/CheckoutBillDetails";
import { DEFAULT_DELIVERY_CHARGE, type DeliveryChargeConfig } from "@/lib/orders/delivery_charge";

interface CheckoutActionProps {
  subtotal: number;
  onPlaceOrder: () => void;
  error?: string | null;
  isSubmitting?: boolean;
}

export function CheckoutAction({
  subtotal,
  onPlaceOrder,
  error,
  isSubmitting = false,
}: CheckoutActionProps) {
  const [deliveryCharge, setDeliveryCharge] = useState<DeliveryChargeConfig>(
    DEFAULT_DELIVERY_CHARGE,
  );
  const [isBreakupOpen, setIsBreakupOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings/delivery-charge")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.ok) setDeliveryCharge(d.config);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Display-only — the server independently recomputes and validates
  // every one of these numbers at order creation; nothing here is
  // trusted for payment.
  const total = subtotal + getMockPlatformFee(subtotal) + deliveryCharge.amount;

  return (
    <>
      <CheckoutBillDetails
        subtotal={subtotal}
        deliveryCharge={deliveryCharge}
        isOpen={isBreakupOpen}
        onClose={() => setIsBreakupOpen(false)}
      />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface-elevated/90 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur-md md:px-16">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col">
              <span className="text-label font-700 uppercase text-muted">
                Total Payable
              </span>
              <span className="font-display text-heading font-800 tabular-nums text-foreground">
                ₹{total}
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
            className="w-full rounded-xl bg-primary py-4 text-body font-800 uppercase tracking-wide text-on-primary shadow-xl shadow-primary/20 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Placing Order..." : "Pay & Place Order"}
          </button>

          {error && (
            <p role="alert" className="text-center text-caption text-danger">
              {error}
            </p>
          )}

          <p className="text-center text-[11px] text-faint">
            Live Order Creation — verified against Supabase database.
          </p>
        </div>
      </div>
    </>
  );
}
