"use client";

import { useState } from "react";
import { getMockPlatformFee } from "@/lib/cart/calculations";
import type { DeliveryChargeConfig } from "@/lib/orders/delivery_charge";

/** Bottom-sheet "View Breakup" content — a real expand/collapse sheet,
 * not an anchor-scroll to a section that was already on screen. */
export function CheckoutBillDetails({
  subtotal,
  deliveryCharge,
  isOpen,
  onClose,
}: {
  subtotal: number;
  deliveryCharge: DeliveryChargeConfig;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [showReason, setShowReason] = useState(false);
  const fee = getMockPlatformFee(subtotal);
  const total = subtotal + fee + deliveryCharge.amount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl animate-in slide-in-from-bottom-4 fade-in duration-200 rounded-t-3xl border border-border-subtle bg-surface-elevated p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl md:px-16">
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
            <span className="tabular-nums">₹{subtotal}</span>
          </div>
          <div className="flex justify-between text-caption text-muted">
            <span>Platform Fee</span>
            <span className="tabular-nums">₹{fee}</span>
          </div>
          <div className="flex justify-between text-caption text-muted">
            <span className="flex items-center gap-1">
              Delivery Charge
              <button
                type="button"
                onClick={() => setShowReason((v) => !v)}
                aria-label="Why this delivery charge?"
                className="text-faint hover:text-primary"
              >
                <span className="material-symbols-outlined text-[14px]">info</span>
              </button>
            </span>
            <span className="tabular-nums">₹{deliveryCharge.amount.toFixed(2)}</span>
          </div>
          {showReason && (
            <p className="rounded-lg bg-surface px-3 py-2 text-[11px] text-faint">
              {deliveryCharge.reason}
              {deliveryCharge.description ? ` — ${deliveryCharge.description}` : ""}
            </p>
          )}
          <div className="flex justify-between border-t border-border-subtle pt-3 text-body font-700 text-foreground">
            <span>Final Total</span>
            <span className="tabular-nums text-primary">₹{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
