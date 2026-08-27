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
      badgeColor: "bg-primary/20 text-primary border-primary/40",
      items: placed.slice(0, 2),
      actionLabel: "Accept Order",
      emptyText: "No new orders right now",
    },
    {
      key: "preparing",
      title: "Preparing",
      count: preparing.length,
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
      items: preparing.slice(0, 2),
      actionLabel: "Mark Ready",
      emptyText: "No orders being prepped",
    },
    {
      key: "ready",
      title: "Ready for Pickup",
      count: ready.length,
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
      items: ready.slice(0, 2),
      actionLabel: "Complete Order",
      emptyText: "No orders waiting for pickup",
    },
    {
      key: "completed",
      title: "Completed Today",
      count: completed.length,
      badgeColor: "bg-white/10 text-zinc-400 border-white/20",
      items: completed.slice(0, 2),
      actionLabel: null,
      emptyText: "No completed orders yet",
    },
  ];

  return (
    <div className="relative flex flex-col gap-4 rounded-2xl border border-white/[0.10] bg-[#0c0c0e]/80 p-4 sm:p-6 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36)]">
      {/* Top glare */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent opacity-60"
        aria-hidden="true"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="font-display text-title font-extrabold text-white">
            Live Order Overview
          </h2>
          <p className="text-caption text-zinc-400">
            Real-time status across all active canteen orders
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAllOrders}
          className="flex items-center gap-1 font-display text-caption font-bold text-primary hover:underline underline-offset-4 cursor-pointer"
        >
          View All Orders ({orders.length})
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((sec) => (
          <div
            key={sec.key}
            className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-md transition-all hover:border-white/[0.14]"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-body-sm font-bold text-white">
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
                <p className="text-caption text-zinc-500">{sec.emptyText}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 flex-1">
                {sec.items.map((ord) => (
                  <div
                    key={ord.id}
                    className="flex flex-col gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 transition-all hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-caption font-extrabold text-white truncate min-w-0 font-mono">
                        {ord.orderNumber.startsWith("#") ? ord.orderNumber : `Order #${ord.orderNumber}`}
                      </span>
                      <span className="font-display text-caption font-bold text-primary shrink-0 font-mono">
                        ₹{ord.totalAmount}
                      </span>
                    </div>

                    <p className="line-clamp-1 text-[12px] text-zinc-400">
                      {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                    </p>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 gap-2 min-w-0">
                      <span className="truncate max-w-[65%] font-medium text-zinc-400" title={ord.studentName}>
                        {ord.studentName}
                      </span>
                      <span className="shrink-0 font-mono">{ord.elapsedTimeText}</span>
                    </div>

                    {sec.actionLabel && (
                      <button
                        type="button"
                        onClick={() => onAdvanceStatus(ord.id)}
                        className="mt-1.5 w-full rounded-xl bg-primary/15 border border-primary/30 py-2 font-display text-[11px] font-bold text-primary hover:bg-primary/25 active:scale-95 transition-all cursor-pointer"
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
