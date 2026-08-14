"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { OrderStatus } from "@/lib/types/database";
import { ORDER_STATE_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/constants";
import { StatusPill } from "@/components/ui/StatusPill";
import { getNextState } from "@/lib/utils/order-state-machine";
import { EmptyState } from "@/components/ui/EmptyState";

type VendorOrder = {
  id: string;
  status: OrderStatus;
  is_delayed: boolean;
  total: number;
  created_at: string;
  items: Array<{ name: string; quantity: number }>;
};

export default function VendorOrderQueue() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const prevCountRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = "sine";
      gain.gain.value = 0.3;
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio not available
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    const res = await fetch("/api/orders?canteen_id=ca000000-0000-0000-0000-000000000001&role=vendor");
    if (res.ok) {
      const data = await res.json();
      const newOrders = data.orders as VendorOrder[];
      // Alert on new orders
      if (newOrders.length > prevCountRef.current && prevCountRef.current > 0) {
        playBeep();
      }
      prevCountRef.current = newOrders.length;
      setOrders(newOrders);
    }
    setLoading(false);
  }, [playBeep]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const advanceStatus = async (orderId: string, currentStatus: OrderStatus) => {
    const next = getNextState(currentStatus);
    if (!next) return;

    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    fetchOrders();
  };

  const activeOrders = orders.filter((o) => o.status !== "ready");
  const completedOrders = orders.filter((o) => o.status === "ready");

  return (
    <div className="px-4 pt-4 pb-4">
      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-6">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
        </span>
        <span className="text-xs font-medium text-text-secondary">
          Live · {activeOrders.length} active order{activeOrders.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeOrders.length === 0 && completedOrders.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No orders yet"
          description="New orders will appear here in real-time with a sound alert."
        />
      ) : (
        <>
          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <div className="space-y-3 mb-8 stagger-children">
              {activeOrders.map((order) => {
                const next = getNextState(order.status);
                return (
                  <div
                    key={order.id}
                    className={`
                      rounded-2xl border bg-surface p-4
                      transition-all duration-300
                      ${order.status === "placed" ? "border-warning/30 animate-slide-in-right" : "border-border"}
                    `}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-mono text-text-muted">
                          #{order.id.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {new Date(order.created_at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <StatusPill status={order.status} isDelayed={order.is_delayed} size="sm" />
                    </div>

                    <div className="space-y-1 mb-4">
                      {order.items.map((item, i) => (
                        <p key={i} className="text-sm text-text">
                          <span className="font-mono text-accent mr-1">{item.quantity}×</span>
                          {item.name}
                        </p>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold">
                        {formatPrice(order.total)}
                      </span>
                      {next && (
                        <button
                          onClick={() => advanceStatus(order.id, order.status)}
                          className={`
                            rounded-xl px-5 py-2.5 text-sm font-semibold
                            transition-all duration-200 active:scale-95
                            ${
                              next === "preparing"
                                ? "bg-accent text-bg hover:bg-accent-dim"
                                : "bg-success text-bg hover:bg-success/80"
                            }
                          `}
                        >
                          {next === "preparing" ? "Start Preparing" : "Mark Ready"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Completed */}
          {completedOrders.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
                Completed ({completedOrders.length})
              </h2>
              <div className="space-y-2">
                {completedOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-border/50 bg-surface/50 px-4 py-3 flex items-center justify-between opacity-60"
                  >
                    <div>
                      <p className="text-xs font-mono text-text-muted">
                        #{order.id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-xs text-text-muted">
                        {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                      </p>
                    </div>
                    <StatusPill status={order.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
