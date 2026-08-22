"use client";

import { useMemo } from "react";

export interface VendorMetricCardsProps {
  ordersCount: number;
  totalRevenue: number;
  avgPrepMinutes: number;
  isLoading?: boolean;
}

export function VendorMetricCards({
  ordersCount,
  totalRevenue,
  avgPrepMinutes,
  isLoading = false,
}: VendorMetricCardsProps) {
  const aov = useMemo(() => {
    if (ordersCount <= 0) return 0;
    return Math.round(totalRevenue / ordersCount);
  }, [ordersCount, totalRevenue]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 min-[320px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-border bg-surface-elevated/50 p-4 animate-pulse flex flex-col justify-between"
          >
            <div className="h-4 w-20 bg-border/40 rounded" />
            <div className="h-7 w-24 bg-border/60 rounded" />
            <div className="h-3 w-16 bg-border/30 rounded" />
          </div>
        ))}
      </div>
    );
  }

  interface MetricItem {
    title: string;
    value: string;
    change: string;
    changeType: "positive" | "negative" | "neutral";
    icon: string;
    iconBg: string;
  }

  const metrics: MetricItem[] = [
    {
      title: "Today's Orders",
      value: ordersCount.toLocaleString(),
      change: ordersCount > 0 ? "+12% vs yesterday" : "0 orders today",
      changeType: ordersCount > 0 ? "positive" : "neutral",
      icon: "shopping_bag",
      iconBg: "bg-primary/10 text-primary",
    },
    {
      title: "Today's Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      change: totalRevenue > 0 ? "+15% vs yesterday" : "₹0 revenue today",
      changeType: totalRevenue > 0 ? "positive" : "neutral",
      icon: "payments",
      iconBg: "bg-emerald-500/10 text-emerald-400",
    },
    {
      title: "Average Order Value",
      value: `₹${aov}`,
      change: aov > 0 ? "Target ₹150+" : "No orders yet",
      changeType: "neutral",
      icon: "analytics",
      iconBg: "bg-blue-500/10 text-blue-400",
    },
    {
      title: "Avg Prep Time",
      value: `${avgPrepMinutes}m`,
      change: "-0.5m target met",
      changeType: "positive",
      icon: "timer",
      iconBg: "bg-amber-500/10 text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 min-[320px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {metrics.map((m) => (
        <div
          key={m.title}
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface-elevated p-3.5 sm:p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-lg"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-display text-caption font-bold text-muted line-clamp-1">
              {m.title}
            </span>
            <div
              className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl ${m.iconBg}`}
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]" aria-hidden="true">
                {m.icon}
              </span>
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <span className="font-display text-title sm:text-display font-extrabold tracking-tight text-foreground">
              {m.value}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-1">
            <span
              className={`inline-flex items-center gap-0.5 font-display text-[10px] sm:text-[11px] font-bold line-clamp-1 ${
                m.changeType === "positive"
                  ? "text-emerald-400"
                  : m.changeType === "negative"
                    ? "text-danger"
                    : "text-muted"
              }`}
            >
              {m.changeType === "positive" && (
                <span className="material-symbols-outlined text-[12px]">trending_up</span>
              )}
              {m.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
