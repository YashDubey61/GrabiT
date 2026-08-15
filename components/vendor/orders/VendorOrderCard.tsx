"use client";

import type { VendorOrder } from "@/lib/mock/vendor";

interface VendorOrderCardProps {
  order: VendorOrder;
  onAdvanceStatus: (orderId: string) => void;
}

export function VendorOrderCard({
  order,
  onAdvanceStatus,
}: VendorOrderCardProps) {
  const isNew = order.status === "placed";
  const isPreparing = order.status === "preparing";
  const isReady = order.status === "ready";

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border p-4 backdrop-blur-md transition-all duration-200 ${
        isNew
          ? "border-primary/40 bg-surface-elevated shadow-glow-primary animate-pulse-subtle"
          : isReady
            ? "border-l-4 border-l-success border-border bg-surface-elevated"
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
            order.paymentType === "PREPAID"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-surface-sunken text-muted border border-border"
          }`}
        >
          {order.paymentType}
        </span>
      </div>

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

      {/* Action Button */}
      {isNew && (
        <button
          type="button"
          onClick={() => onAdvanceStatus(order.id)}
          className="w-full rounded-xl bg-primary py-3 font-display text-caption font-extrabold uppercase tracking-widest text-on-primary shadow-glow-primary transition-all duration-150 active:scale-95 hover:opacity-90"
        >
          Accept Order
        </button>
      )}

      {isPreparing && (
        <button
          type="button"
          onClick={() => onAdvanceStatus(order.id)}
          className="w-full rounded-xl border-2 border-primary py-3 font-display text-caption font-extrabold uppercase tracking-widest text-primary transition-all duration-150 active:scale-95 hover:bg-primary/10"
        >
          Mark as Ready
        </button>
      )}

      {isReady && (
        <button
          type="button"
          onClick={() => onAdvanceStatus(order.id)}
          className="w-full rounded-xl bg-success py-3 font-display text-caption font-extrabold uppercase tracking-widest text-black transition-all duration-150 active:scale-95 hover:opacity-90"
        >
          Hand Over Complete
        </button>
      )}
    </div>
  );
}
