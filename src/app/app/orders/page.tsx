"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice, ORDER_STATE_LABELS } from "@/lib/constants";
import { OrderStatus } from "@/lib/types/database";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderCardSkeleton } from "@/components/ui/Skeleton";

type OrderSummary = {
  id: string;
  status: OrderStatus;
  is_delayed: boolean;
  total: number;
  student_fee: number;
  items: Array<{ name: string; quantity: number }>;
  created_at: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Your Orders</h1>

      {loading ? (
        <div className="space-y-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No orders yet"
          description="Place your first order from a campus canteen."
          action={
            <Link
              href="/app"
              className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-bg hover:bg-accent-dim transition-colors"
            >
              Browse Canteens
            </Link>
          }
        />
      ) : (
        <div className="space-y-4 stagger-children">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/app/orders/${order.id}`}
              className="
                block rounded-2xl border border-border bg-surface p-5
                transition-all duration-200
                hover:border-accent/30 hover:bg-surface-2
                active:scale-[0.98]
              "
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-mono text-text-muted">
                  #{order.id.slice(-8).toUpperCase()}
                </p>
                <StatusPill status={order.status} isDelayed={order.is_delayed} size="sm" />
              </div>
              <p className="text-sm text-text-secondary line-clamp-1">
                {order.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-mono font-semibold text-sm">
                  {formatPrice(order.total + order.student_fee)}
                </span>
                <span className="text-xs text-text-muted">
                  {new Date(order.created_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
