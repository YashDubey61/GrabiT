"use client";

import type { VendorOrder } from "@/lib/mock/vendor";

export interface VendorLiveOrderOverviewProps {
  orders: VendorOrder[];
  onAdvanceStatus: (orderId: string) => void;
  onCancelOrder: (orderId: string, reason: string) => void;
  onViewAllOrders: () => void;
}

export function VendorLiveOrderOverview({
  orders,
  onAdvanceStatus,
  onViewAllOrders,
}: VendorLiveOrderOverviewProps) {
  const placed = orders.filter((o) => o.status === "placed");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "ready");
  const completed = orders.filter(
    (o) => o.status === "completed" || o.status === "picked_up",
  );

  const sections = [
    {
      key: "placed",
      title: "New Orders",
      count: placed.length,
      badgeColor: "bg-primary/20 text-primary border-primary/30",
      items: placed.slice(0, 2),
      actionLabel: "Accept Order",
      emptyText: "No new orders right now",
    },
    {
      key: "preparing",
      title: "Preparing",
      count: preparing.length,
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      items: preparing.slice(0, 2),
      actionLabel: "Mark Ready",
      emptyText: "No orders being prepped",
    },
    {
      key: "ready",
      title: "Ready for Pickup",
      count: ready.length,
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      items: ready.slice(0, 2),
      actionLabel: "Complete Order",
      emptyText: "No orders waiting for pickup",
    },
    {
      key: "completed",
      title: "Completed Today",
      count: completed.length,
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      items: completed.slice(0, 2),
      actionLabel: null,
      emptyText: "No completed orders yet",
    },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
        <div>
          <h2 className="font-display text-title font-bold text-foreground">
            Live Order Overview
          </h2>
          <p className="text-caption text-muted">
            Real-time status across all active canteen orders
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAllOrders}
          className="flex items-center gap-1 font-display text-caption font-bold text-primary hover:underline underline-offset-4"
        >
          View All Orders ({orders.length})
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((sec) => (
          <div
            key={sec.key}
            className="flex flex-col gap-3 rounded-xl border border-border/80 bg-background/50 p-4 transition-all hover:border-border"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-body-sm font-bold text-foreground">
                {sec.title}
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 font-display text-[11px] font-extrabold ${sec.badgeColor}`}
              >
                {sec.count}
              </span>
            </div>

            {sec.items.length === 0 ? (
              <div className="flex flex-1 items-center justify-center py-6 text-center">
                <p className="text-caption text-faint">{sec.emptyText}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 flex-1">
                {sec.items.map((ord) => (
                  <div
                    key={ord.id}
                    className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-surface-elevated p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-caption font-extrabold text-foreground truncate min-w-0">
                        {ord.orderNumber.startsWith("#") ? ord.orderNumber : `Order #${ord.orderNumber}`}
                      </span>
                      <span className="font-display text-caption font-bold text-primary shrink-0">
                        ₹{ord.totalAmount}
                      </span>
                    </div>

                    <p className="line-clamp-1 text-[12px] text-muted">
                      {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                    </p>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-faint gap-2 min-w-0">
                      <span className="truncate max-w-[65%] font-medium" title={ord.studentName}>
                        {ord.studentName}
                      </span>
                      <span className="shrink-0">{ord.elapsedTimeText}</span>
                    </div>

                    {sec.actionLabel && (
                      <button
                        type="button"
                        onClick={() => onAdvanceStatus(ord.id)}
                        className="mt-1.5 w-full rounded-md bg-primary/10 py-1.5 font-display text-[11px] font-bold text-primary hover:bg-primary/20 active:scale-95 transition-all"
                      >
                        {sec.actionLabel}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
