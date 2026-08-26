"use client";

import { useState } from "react";
import type { VendorOrder } from "@/lib/mock/vendor";
import { vendorOrderToReceipt } from "@/components/shared/receipt-printer/adapters";
import { ThermalPrinterModal } from "@/components/vendor/printer/ThermalPrinterModal";
import { useModalBackHandler } from "@/lib/navigation/backButtonManager";

export interface VendorOrderDetailModalProps {
  order: VendorOrder | null;
  isOpen: boolean;
  onClose: () => void;
  vendorName?: string;
  onAdvanceStatus?: (orderId: string) => Promise<void> | void;
  onCancelOrder?: (orderId: string, reason: string) => Promise<void> | void;
}

export function VendorOrderDetailModal({
  order,
  isOpen,
  onClose,
  vendorName = "Kitchen",
  onAdvanceStatus,
}: VendorOrderDetailModalProps) {
  const [isPrinterOpen, setIsPrinterOpen] = useState(false);
  useModalBackHandler(isOpen, onClose, "vendor-order-detail-modal");
  if (!isOpen || !order) return null;

  const isNew = order.status === "placed";
  const isPreparing = order.status === "preparing";
  const isReady = order.status === "ready";
  const isPickedUp = order.status === "picked_up";
  const isCompleted = order.status === "completed";
  const isCancelled = order.status === "cancelled";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-title font-extrabold text-foreground">
                Order {order.orderNumber}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 font-display text-[11px] font-extrabold uppercase ${
                  isCancelled
                    ? "bg-danger/20 text-danger border border-danger/30"
                    : isCompleted || isPickedUp
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : isReady
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : isPreparing
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-primary/20 text-primary border border-primary/30"
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="mt-0.5 text-caption text-muted">
              Placed {order.elapsedTimeText} • {order.studentName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-muted hover:bg-background hover:text-foreground"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        {/* OTP Highlight if Ready */}
        {isReady && order.otpCode && (
          <div className="flex items-center justify-between rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
            <div>
              <span className="font-display text-caption font-bold uppercase tracking-wider text-blue-400">
                Customer Pickup OTP Code
              </span>
              <p className="text-[12px] text-muted">
                Ask student for OTP before completing handover
              </p>
            </div>
            <span className="font-mono text-display font-extrabold tracking-[0.25em] text-blue-400">
              {order.otpCode}
            </span>
          </div>
        )}

        {/* Order Items Breakdown */}
        <div className="flex flex-col gap-3">
          <h3 className="font-display text-body-sm font-bold uppercase tracking-wider text-muted">
            Ordered Items
          </h3>
          <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-background/50 p-4">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between border-b border-border/40 pb-2.5 last:border-b-0 last:pb-0"
              >
                <div className="flex flex-col">
                  <span className="font-display text-body-sm font-bold text-foreground">
                    {item.quantity}x {item.name}
                  </span>
                  {item.notes && (
                    <span className="text-caption text-primary italic">
                      Note: {item.notes}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Details */}
        <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-background/50 p-4">
          <div className="flex justify-between text-caption text-muted">
            <span>Payment Method</span>
            <span className="font-bold text-foreground">{order.paymentType}</span>
          </div>
          <div className="flex justify-between text-caption text-muted">
            <span>Payment Status</span>
            <span className="font-bold text-emerald-400">PAID</span>
          </div>
          <div className="my-1 h-px bg-border/50" />
          <div className="flex justify-between font-display text-body-sm font-extrabold text-foreground">
            <span>Total Amount</span>
            <span className="text-primary">₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Timestamps / Lifecycle */}
        <div className="flex flex-col gap-1.5 text-[11px] text-faint">
          {order.createdAtIso && (
            <div>Placed: {new Date(order.createdAtIso).toLocaleString()}</div>
          )}
          {order.acceptedAtIso && (
            <div>Accepted: {new Date(order.acceptedAtIso).toLocaleString()}</div>
          )}
          {order.pickedUpAtIso && (
            <div>Picked Up: {new Date(order.pickedUpAtIso).toLocaleString()}</div>
          )}
          {order.completedAtIso && (
            <div>Completed: {new Date(order.completedAtIso).toLocaleString()}</div>
          )}
          {order.cancellationReason && (
            <div className="text-danger">
              Cancellation Reason: {order.cancellationReason}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsPrinterOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-sunken px-4 py-2.5 font-display text-caption font-bold text-muted hover:border-primary/40 hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Print Receipt
          </button>

          <div className="flex items-center gap-3">
            {onAdvanceStatus && !isCompleted && !isCancelled && (
              <button
                type="button"
                onClick={async () => {
                  await onAdvanceStatus(order.id);
                  onClose();
                }}
                className="rounded-xl bg-primary px-5 py-2.5 font-display text-caption font-bold text-on-primary hover:opacity-90 active:scale-95"
              >
                {isNew
                  ? "Accept Order"
                  : isPreparing
                    ? "Mark Ready"
                    : isReady
                      ? "Confirm Pickup"
                      : "Complete Handover"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2.5 font-display text-caption font-bold text-muted hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <ThermalPrinterModal
        open={isPrinterOpen}
        onClose={() => setIsPrinterOpen(false)}
        order={vendorOrderToReceipt(order, vendorName)}
      />
    </div>
  );
}
