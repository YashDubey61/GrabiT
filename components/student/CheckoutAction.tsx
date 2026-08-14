"use client";

import { useState } from "react";
import { getMockPlatformFee } from "@/components/student/CheckoutBillDetails";

/**
 * Fixed bottom bar — "Total Payable" + "Pay & Place Order", matching the
 * approved export. The button is a real, clickable UI element (per Day 3
 * step 9, "implement the UI only") but does nothing beyond toggling a
 * local note — no order is created, no payment API is called, no success
 * state is faked. Total is derived from `subtotal` via the same
 * getMockPlatformFee used in CheckoutBillDetails — one source of truth,
 * not a second copy of the math.
 */
export function CheckoutAction({ subtotal }: { subtotal: number }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const total = subtotal + getMockPlatformFee(subtotal);

  return (
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
          <a
            href="#bill-details"
            className="flex items-center gap-1 text-caption font-700 text-primary"
          >
            View Breakup
            <span className="material-symbols-outlined text-sm" aria-hidden="true">
              expand_less
            </span>
          </a>
        </div>

        <button
          type="button"
          onClick={() => setAcknowledged(true)}
          className="w-full rounded-xl bg-primary py-4 text-body font-800 uppercase tracking-wide text-on-primary shadow-xl shadow-primary/20 transition-transform active:scale-95"
        >
          Pay &amp; Place Order
        </button>

        {acknowledged && (
          <p role="status" className="text-center text-caption text-muted">
            This is a mock checkout — no payment was processed and no order
            was placed. Real payment integration comes in a later phase.
          </p>
        )}
      </div>
    </div>
  );
}
