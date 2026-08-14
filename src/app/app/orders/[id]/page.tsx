"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { formatPrice, ORDER_STATES, ORDER_STATE_LABELS, ORDER_STATE_SEQUENCE } from "@/lib/constants";
import { OrderStatus } from "@/lib/types/database";
import { getStateIndex } from "@/lib/utils/order-state-machine";

type OrderDetail = {
  id: string;
  status: OrderStatus;
  is_delayed: boolean;
  total: number;
  student_fee: number;
  payment_method: string;
  created_at: string;
  items: Array<{ name: string; quantity: number; unit_price: number; subtotal: number }>;
};

const STATUS_ICONS: Record<OrderStatus, string> = {
  placed: "📝",
  preparing: "🍳",
  ready: "✅",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  placed: "text-warning",
  preparing: "text-accent",
  ready: "text-success",
};

const STATUS_BG: Record<OrderStatus, string> = {
  placed: "bg-warning/10 border-warning/30",
  preparing: "bg-accent/10 border-accent/30",
  ready: "bg-success/10 border-success/30",
};

export default function OrderTrackerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orderId } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [prevStatus, setPrevStatus] = useState<OrderStatus | null>(null);
  const [animating, setAnimating] = useState(false);

  const fetchOrder = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}`);
    if (res.ok) {
      const data = await res.json();
      setOrder((prev) => {
        if (prev && prev.status !== data.order.status) {
          setPrevStatus(prev.status);
          setAnimating(true);
          // Trigger haptic
          if (navigator.vibrate) navigator.vibrate(100);
          setTimeout(() => setAnimating(false), 800);
        }
        return data.order;
      });
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    // Poll every 3s for live updates (replaced by Supabase Realtime in prod)
    const interval = setInterval(fetchOrder, 3000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentIndex = getStateIndex(order.status);

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <header className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href="/app/orders"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-2 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Order Tracker</h1>
            <p className="text-xs font-mono text-text-muted">
              #{order.id.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 space-y-8">
        {/* ── Big Status Display ─── */}
        <div
          className={`
            flex flex-col items-center py-10 rounded-3xl border
            transition-all duration-700 ease-out
            ${STATUS_BG[order.status]}
            ${animating ? "animate-scale-in" : ""}
          `}
        >
          <span
            className={`
              text-6xl mb-4 transition-transform duration-500
              ${animating ? "animate-bounce-subtle" : ""}
            `}
          >
            {order.is_delayed ? "⏳" : STATUS_ICONS[order.status]}
          </span>
          <h2
            className={`
              text-xl font-bold tracking-tight
              transition-colors duration-500
              ${order.is_delayed ? "text-error" : STATUS_COLORS[order.status]}
            `}
          >
            {order.is_delayed ? "Pickup Delayed" : ORDER_STATE_LABELS[order.status]}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {order.status === "placed" && "Your order is in the queue"}
            {order.status === "preparing" && "The vendor is making your food"}
            {order.status === "ready" && "Head to the counter to pick up!"}
          </p>
        </div>

        {/* ── Progress Timeline ─── */}
        <div className="px-2">
          <div className="relative flex items-center justify-between">
            {/* Background line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-surface-2 rounded-full" />
            {/* Active line */}
            <div
              className="absolute top-4 left-4 h-0.5 bg-accent rounded-full transition-all duration-700 ease-out"
              style={{
                width: `calc(${(currentIndex / (ORDER_STATE_SEQUENCE.length - 1)) * 100}% - 2rem)`,
              }}
            />

            {ORDER_STATE_SEQUENCE.map((state, index) => {
              const reached = index <= currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <div
                  key={state}
                  className="relative z-10 flex flex-col items-center gap-2"
                >
                  <div
                    className={`
                      flex h-8 w-8 items-center justify-center rounded-full
                      transition-all duration-500 ease-out
                      ${
                        reached
                          ? isCurrent
                            ? "bg-accent text-bg shadow-[0_0_16px_rgba(255,109,0,0.4)] animate-pulse-accent"
                            : "bg-accent text-bg"
                          : "bg-surface-2 text-text-muted"
                      }
                      ${isCurrent && animating ? "animate-scale-in" : ""}
                    `}
                  >
                    {reached ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`
                      text-[10px] font-medium text-center max-w-[5rem]
                      ${reached ? "text-text" : "text-text-muted"}
                    `}
                  >
                    {ORDER_STATE_LABELS[state]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Order Items ─── */}
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Items
          </h3>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-text-secondary">
                {item.name} × {item.quantity}
              </span>
              <span className="font-mono text-text">
                {formatPrice(item.subtotal)}
              </span>
            </div>
          ))}
          <div className="h-px bg-border" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">Total</span>
            <span className="font-mono font-semibold text-text">
              {formatPrice(order.total + order.student_fee)}
            </span>
          </div>
        </div>

        {/* ── Actions ─── */}
        {order.status !== "ready" && (
          <button
            onClick={async () => {
              await fetch(`/api/orders/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_delayed: !order.is_delayed }),
              });
              fetchOrder();
            }}
            className="
              w-full rounded-xl border border-border bg-surface
              px-4 py-3 text-sm font-medium text-text-secondary
              hover:bg-surface-2 hover:text-text transition-colors
            "
          >
            {order.is_delayed ? "Cancel delay" : "⏳ Delay my pickup"}
          </button>
        )}
      </div>
    </div>
  );
}
