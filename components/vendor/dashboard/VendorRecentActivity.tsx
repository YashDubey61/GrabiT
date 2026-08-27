"use client";

import type { VendorOrder } from "@/lib/mock/vendor";

export interface VendorRecentActivityProps {
  orders: VendorOrder[];
  isLoading?: boolean;
}

export function VendorRecentActivity({
  orders,
  isLoading = false,
}: VendorRecentActivityProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-4 sm:p-6">
        <div className="h-6 w-40 bg-border/40 rounded animate-pulse" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-background/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Derive recent activities from recent live orders
  const activities = orders.slice(0, 5).map((o) => {
    let title = `Order #${o.orderNumber} placed`;
    let icon = "shopping_bag";
    let color = "text-primary bg-primary/10";

    if (o.status === "completed" || o.status === "picked_up") {
      title = `Order #${o.orderNumber} completed by ${o.studentName}`;
      icon = "check_circle";
      color = "text-emerald-400 bg-emerald-500/15 border border-emerald-500/30";
    } else if (o.status === "ready") {
      title = `Order #${o.orderNumber} marked ready for pickup`;
      icon = "notifications_active";
      color = "text-emerald-400 bg-emerald-500/15 border border-emerald-500/30";
    } else if (o.status === "preparing") {
      title = `Order #${o.orderNumber} accepted & preparing`;
      icon = "cooking";
      color = "text-amber-400 bg-amber-500/15 border border-amber-500/30";
    }

    return {
      id: o.id,
      title,
      subtext: `${o.items.length} items • ₹${o.totalAmount} • ${o.elapsedTimeText}`,
      time: o.elapsedTimeText,
      icon,
      color,
    };
  });

  return (
    <div className="relative flex flex-col gap-4 rounded-2xl border border-white/[0.10] bg-[#0c0c0e]/80 p-4 sm:p-6 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36)]">
      {/* Top glare */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent opacity-60"
        aria-hidden="true"
      />

      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div>
          <h2 className="font-display text-title font-extrabold text-white">
            Recent Canteen Activity
          </h2>
          <p className="text-caption text-zinc-400">
            Live operations log for current orders and updates
          </p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="material-symbols-outlined text-[32px] text-zinc-500">
            history
          </span>
          <p className="text-caption text-zinc-400">No activity logged yet today.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activities.map((act) => (
            <div
              key={act.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-md transition-all hover:border-primary/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${act.color}`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {act.icon}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="truncate font-display text-body-sm font-bold text-white">
                    {act.title}
                  </p>
                  <p className="text-caption text-zinc-400">{act.subtext}</p>
                </div>
              </div>

              <span className="shrink-0 text-caption font-bold text-zinc-500 font-mono">
                {act.time}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
