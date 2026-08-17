"use client";

import { useState } from "react";
import type { VendorOrder } from "@/lib/mock/vendor";

const REJECT_REASONS = ["Item unavailable", "Vendor too busy", "Other"];

interface IncomingOrderAlertProps {
  pendingOrders: VendorOrder[];
  onAccept: (orderId: string) => Promise<void> | void;
  onReject: (orderId: string, reason: string) => Promise<void> | void;
}

export function IncomingOrderAlert({
  pendingOrders,
  onAccept,
  onReject,
}: IncomingOrderAlertProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [customReason, setCustomReason] = useState("");

  if (pendingOrders.length === 0) return null;

  const order = pendingOrders[0];
  const total = pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await onAccept(order.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    const finalReason =
      reason === "Other" && customReason.trim() ? customReason.trim() : reason;
    setIsProcessing(true);
    try {
      await onReject(order.id, finalReason);
    } finally {
      setIsProcessing(false);
      setIsRejecting(false);
      setReason(REJECT_REASONS[0]);
      setCustomReason("");
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-4 sm:pt-6">
      <div className="pointer-events-auto w-full max-w-md rounded-3xl border-2 border-primary bg-surface shadow-2xl shadow-primary/30 animate-in slide-in-from-top-4 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-3xl bg-primary/10 px-5 py-3 border-b border-primary/30">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <span className="font-display text-caption font-extrabold uppercase tracking-widest text-primary">
              {pendingOrders.length > 1 ? `${pendingOrders.length} New Orders` : "New Order"}
            </span>
          </div>
          <span className="material-symbols-outlined text-[20px] text-primary animate-pulse">
            notifications_active
          </span>
        </div>

        {!isRejecting ? (
          <div className="p-5">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-display text-title font-extrabold text-foreground">
                  {order.orderNumber}
                </h3>
                <p className="text-caption text-faint font-medium">{order.studentName}</p>
              </div>
              <span
                className={`rounded-md px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider ${
                  order.paymentType === "PREPAID"
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-surface-sunken text-muted border border-border"
                }`}
              >
                {order.paymentType}
              </span>
            </div>

            <div className="mb-3 flex flex-col gap-1.5 rounded-xl border border-border bg-surface-elevated p-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-body-sm">
                  <span className="font-semibold text-foreground">
                    {item.quantity} × {item.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-caption font-bold uppercase tracking-wider text-muted">
                Total
              </span>
              <span className="font-display text-heading font-extrabold text-foreground">
                ₹{order.totalAmount}
              </span>
            </div>

            {pendingOrders.length > 1 && (
              <p className="mb-3 text-center text-caption text-faint">
                +{pendingOrders.length - 1} more waiting · ₹{total} total
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex-1 rounded-xl bg-primary py-3.5 font-display text-body-sm font-extrabold uppercase tracking-widest text-on-primary shadow-glow-primary transition-all duration-150 active:scale-95 hover:opacity-90 disabled:opacity-50"
              >
                {isProcessing ? "Accepting..." : "Accept"}
              </button>
              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                disabled={isProcessing}
                className="flex-1 rounded-xl border border-danger/40 bg-danger-soft/30 py-3.5 font-display text-body-sm font-extrabold uppercase tracking-widest text-danger transition-all duration-150 active:scale-95 hover:bg-danger-soft/60 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <h3 className="mb-1 font-display text-body font-extrabold text-foreground">
              Reject this order?
            </h3>
            <p className="mb-3 text-caption text-faint">
              {order.orderNumber} will be cancelled and the student notified.
            </p>

            <div className="mb-4 flex flex-col gap-2">
              <label className="font-display text-caption font-bold text-muted">
                Reason (optional)
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-elevated p-3 font-body text-body-sm text-foreground focus:border-primary focus:outline-none"
              >
                {REJECT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {reason === "Other" && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Specify reason..."
                  className="w-full rounded-xl border border-border bg-surface-elevated p-3 font-body text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                />
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsRejecting(false)}
                disabled={isProcessing}
                className="flex-1 rounded-xl border border-border bg-surface-elevated py-3 font-display text-caption font-bold text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessing}
                className="flex-1 rounded-xl bg-danger py-3 font-display text-caption font-bold uppercase tracking-wider text-white shadow-lg shadow-danger/20 hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? "Rejecting..." : "Reject Order"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
