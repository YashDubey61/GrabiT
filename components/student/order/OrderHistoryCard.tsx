"use client";

import Link from "next/link";
import type { Order, OrderStatus } from "@/lib/orders/types";
import { formatOrderTimestamp } from "@/lib/utils/formatDate";

interface OrderHistoryCardProps {
  order: Order;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; badgeClass: string; isOngoing: boolean }
> = {
  placed: {
    label: "Placed",
    badgeClass: "bg-warning-soft text-warning border border-warning/30",
    isOngoing: true,
  },
  preparing: {
    label: "Preparing",
    badgeClass: "bg-primary/10 text-primary border border-primary/30",
    isOngoing: true,
  },
  ready: {
    label: "Ready for Pickup",
    badgeClass: "bg-success-soft text-success border border-success/30",
    isOngoing: true,
  },
  picked_up: {
    label: "Picked Up",
    badgeClass: "bg-primary/10 text-primary border border-primary/30",
    isOngoing: true,
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-surface-elevated text-success border border-success/20",
    isOngoing: false,
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-danger-soft text-danger border border-danger/30",
    isOngoing: false,
  },
};

export function OrderHistoryCard({ order }: OrderHistoryCardProps) {
  const statusInfo = STATUS_CONFIG[order.status as OrderStatus] ?? {
    label: order.status,
    badgeClass: "bg-surface-elevated text-muted border border-border",
    isOngoing: false,
  };

  const itemsSummary = order.items
    .map((item) => `${item.quantity}x ${item.name}`)
    .join(", ");

  const formattedDate = formatOrderTimestamp(order.createdAt);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-4 backdrop-blur-md transition-all hover:border-border/80 sm:p-5">
      {/* Top row: Canteen info & Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-elevated text-primary border border-border">
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
              storefront
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-heading font-bold text-foreground">
                {order.canteenName}
              </h3>
              <span className="text-caption text-faint font-mono">
                {order.orderNumber}
              </span>
            </div>
            <p className="text-caption text-muted">{formattedDate}</p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-md px-2.5 py-1 font-display text-[11px] font-semibold uppercase tracking-wider ${statusInfo.badgeClass}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Divider & Items summary */}
      <div className="border-t border-border/50 pt-3">
        <div className="flex items-center justify-between gap-4">
          <p className="line-clamp-2 text-body-sm text-muted">
            {itemsSummary}
          </p>
          <span className="shrink-0 font-display text-body font-bold text-primary">
            ₹{order.totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Bottom CTA actions */}
      <div className="flex gap-2 pt-1">
        <Link
          href={`/customer/orders/${order.id}`}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-center font-display text-body-sm font-bold uppercase tracking-wider transition-all duration-150 active:scale-[0.98] ${
            statusInfo.isOngoing
              ? "bg-primary text-on-primary shadow-glow-primary hover:opacity-90"
              : "border border-primary/40 text-primary hover:bg-primary/10"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            {statusInfo.isOngoing ? "two_wheeler" : "receipt"}
          </span>
          {statusInfo.isOngoing ? "Track Order" : "View Order"}
        </Link>

        <Link
          href={`/customer/orders/${order.id}`}
          aria-label={`View order ${order.orderNumber} details`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:bg-surface-elevated hover:text-foreground active:scale-[0.95]"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            chevron_right
          </span>
        </Link>
      </div>
    </div>
  );
}
