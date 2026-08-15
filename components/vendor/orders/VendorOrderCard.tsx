"use client";

import { useState } from "react";
import type { VendorOrder } from "@/lib/mock/vendor";

interface VendorOrderCardProps {
  order: VendorOrder;
  onAdvanceStatus: (orderId: string) => Promise<void> | void;
  onCancelOrder?: (orderId: string, reason: string) => Promise<void>;
}

const CANCELLATION_REASONS = [
  "Item Out of Stock",
  "Kitchen Capacity Full",
  "Ingredient Unavailable",
  "Store Closing Soon",
  "Other Reason",
];

export function VendorOrderCard({
  order,
  onAdvanceStatus,
  onCancelOrder,
}: VendorOrderCardProps) {
  const isNew = order.status === "placed";
  const isPreparing = order.status === "preparing";
  const isReady = order.status === "ready";
  const isPickedUp = order.status === "picked_up";
  const isCompleted = order.status === "completed";
  const isCancelled = order.status === "cancelled";

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleAdvance = async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      await onAdvanceStatus(order.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!onCancelOrder) return;
    const finalReason =
      selectedReason === "Other Reason" && customReason.trim()
        ? customReason.trim()
        : selectedReason;

    setIsCancelling(true);
    await onCancelOrder(order.id, finalReason);
    setIsCancelling(false);
    setShowCancelModal(false);
  };

  return (
    <>
      <div
        className={`flex flex-col gap-4 rounded-2xl border p-4 backdrop-blur-md transition-all duration-200 ${
          isNew
            ? "border-primary/40 bg-surface-elevated shadow-glow-primary animate-pulse-subtle"
            : isReady
              ? "border-l-4 border-l-success border-border bg-surface-elevated"
              : isPickedUp
                ? "border-l-4 border-l-primary border-border bg-surface-elevated"
                : isCompleted
                  ? "border-border bg-surface-elevated/50 opacity-75"
                  : isCancelled
                    ? "border-danger/30 bg-danger-soft/20 opacity-75"
                    : "border-border bg-surface-elevated"
        }`}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-body font-bold text-foreground">
              {order.orderNumber} • {order.studentName}
            </h3>
            <p className="text-caption text-faint font-medium">
              {order.elapsedTimeText}
            </p>
          </div>

          <span
            className={`rounded-md px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider ${
              isCancelled
                ? "bg-danger/20 text-danger border border-danger/30"
                : isCompleted
                  ? "bg-surface-elevated text-faint border border-border"
                  : order.paymentType === "PREPAID"
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-surface-sunken text-muted border border-border"
            }`}
          >
            {isCancelled ? "CANCELLED" : isCompleted ? "COMPLETED" : order.paymentType}
          </span>
        </div>

        {/* Cancellation Reason Badge */}
        {isCancelled && order.cancellationReason && (
          <div className="rounded-xl border border-danger/30 bg-danger-soft/40 p-2.5 text-caption font-medium text-danger">
            <span className="font-bold">Reason:</span> {order.cancellationReason}
          </div>
        )}

        {/* Preparation Progress Bar */}
        {isPreparing && order.prepProgressPercent !== undefined && (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-caption font-semibold text-primary">
              <span>In Prep</span>
              <span>{order.prepProgressPercent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${order.prepProgressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="flex flex-col gap-2 border-y border-border/50 py-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="font-display text-body-sm font-semibold text-foreground">
                {item.quantity}x {item.name}
              </span>
              {item.notes && (
                <span className="text-caption text-primary italic">
                  {item.notes}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* OTP Code Badge if Ready */}
        {isReady && order.otpCode && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface-sunken p-2.5">
            <span className="font-display text-[11px] font-bold uppercase text-muted">
              OTP CODE
            </span>
            <span className="font-mono text-heading font-extrabold tracking-[0.2em] text-success">
              {order.otpCode}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        {isNew && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdvance}
              disabled={isProcessing}
              className="flex-1 rounded-xl bg-primary py-3 font-display text-caption font-extrabold uppercase tracking-widest text-on-primary shadow-glow-primary transition-all duration-150 active:scale-95 hover:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? "Accepting..." : "Accept"}
            </button>
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              disabled={isProcessing}
              className="rounded-xl border border-danger/40 bg-danger-soft/30 px-4 py-3 font-display text-caption font-extrabold uppercase tracking-wider text-danger transition-all duration-150 active:scale-95 hover:bg-danger-soft/60 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}

        {isPreparing && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleAdvance}
              disabled={isProcessing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-caption font-extrabold uppercase tracking-widest text-on-primary shadow-glow-primary transition-all duration-150 active:scale-95 hover:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                  <span>Marking Ready...</span>
                </>
              ) : (
                "Mark as Ready"
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              disabled={isProcessing}
              className="w-full rounded-xl border border-border py-2 font-display text-label font-bold uppercase tracking-wider text-faint hover:text-danger hover:border-danger/30 transition-colors disabled:opacity-50"
            >
              Cancel Order
            </button>
          </div>
        )}

        {isReady && (
          <button
            type="button"
            onClick={handleAdvance}
            disabled={isProcessing}
            className="w-full rounded-xl bg-success py-3 font-display text-caption font-extrabold uppercase tracking-widest text-black shadow-lg shadow-success/20 transition-all duration-150 active:scale-95 hover:opacity-90 disabled:opacity-50"
          >
            {isProcessing ? "Confirming..." : "Confirm Pickup"}
          </button>
        )}

        {isPickedUp && (
          <button
            type="button"
            onClick={handleAdvance}
            disabled={isProcessing}
            className="w-full rounded-xl bg-primary/20 border border-primary/40 py-3 font-display text-caption font-extrabold uppercase tracking-widest text-primary transition-all duration-150 active:scale-95 hover:bg-primary/30 disabled:opacity-50"
          >
            {isProcessing ? "Completing..." : "Complete Handover"}
          </button>
        )}

        {isCompleted && (
          <div className="rounded-xl border border-border bg-surface-sunken p-2.5 text-center font-display text-caption font-bold text-faint uppercase tracking-wider">
            ✓ Order Completed
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-2xl">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
                <span className="material-symbols-outlined text-[20px]">block</span>
              </div>
              <h3 className="font-display text-heading font-extrabold text-foreground">
                Cancel Order {order.orderNumber}?
              </h3>
              <p className="mt-1 font-body text-caption text-faint">
                The student will be notified immediately and refunded.
              </p>
            </div>

            {/* Cancellation Reason Dropdown */}
            <div className="mb-4 flex flex-col gap-2">
              <label className="font-display text-caption font-bold text-muted">
                Select Reason
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-elevated p-3 font-body text-body-sm text-foreground focus:border-primary focus:outline-none"
              >
                {CANCELLATION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {selectedReason === "Other Reason" && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Specify cancellation reason..."
                  className="mt-1 w-full rounded-xl border border-border bg-surface-elevated p-3 font-body text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                />
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="flex-1 rounded-xl border border-border bg-surface-elevated py-3 font-display text-caption font-bold text-muted hover:text-foreground transition-colors"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="flex-1 rounded-xl bg-danger py-3 font-display text-caption font-bold uppercase tracking-wider text-white shadow-lg shadow-danger/20 hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
