"use client";

import { useState } from "react";
import type { VendorOrder, VendorOrderStatus } from "@/lib/mock/vendor";
import { VendorOrderCard } from "@/components/vendor/orders/VendorOrderCard";

interface VendorOrdersBoardProps {
  orders: VendorOrder[];
  onAdvanceStatus: (orderId: string) => void;
}

export function VendorOrdersBoard({
  orders,
  onAdvanceStatus,
}: VendorOrdersBoardProps) {
  const [mobileTab, setMobileTab] = useState<VendorOrderStatus>("placed");

  const newOrders = orders.filter((o) => o.status === "placed");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  return (
    <section className="flex flex-col gap-4">
      {/* Mobile Tab Filter Bar */}
      <div className="flex gap-2 sm:hidden border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setMobileTab("placed")}
          className={`flex-1 rounded-xl py-2 font-display text-caption font-bold transition-all ${
            mobileTab === "placed"
              ? "bg-primary text-on-primary"
              : "bg-surface-elevated text-muted"
          }`}
        >
          New ({newOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preparing")}
          className={`flex-1 rounded-xl py-2 font-display text-caption font-bold transition-all ${
            mobileTab === "preparing"
              ? "bg-primary text-on-primary"
              : "bg-surface-elevated text-muted"
          }`}
        >
          Preparing ({preparingOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("ready")}
          className={`flex-1 rounded-xl py-2 font-display text-caption font-bold transition-all ${
            mobileTab === "ready"
              ? "bg-success text-black"
              : "bg-surface-elevated text-muted"
          }`}
        >
          Ready ({readyOrders.length})
        </button>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* NEW ORDERS COLUMN */}
        <div
          className={`flex flex-col gap-4 ${
            mobileTab !== "placed" ? "hidden sm:flex" : "flex"
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-primary animate-ping" />
              <h2 className="font-display text-heading font-bold text-foreground">
                New
              </h2>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 font-display text-caption font-semibold text-primary">
              {newOrders.length} Incoming
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {newOrders.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface-elevated/40 p-6 text-center text-caption text-muted">
                No new orders in queue.
              </div>
            ) : (
              newOrders.map((order) => (
                <VendorOrderCard
                  key={order.id}
                  order={order}
                  onAdvanceStatus={onAdvanceStatus}
                />
              ))
            )}
          </div>
        </div>

        {/* PREPARING COLUMN */}
        <div
          className={`flex flex-col gap-4 ${
            mobileTab !== "preparing" ? "hidden sm:flex" : "flex"
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <h2 className="font-display text-heading font-bold text-foreground">
                Preparing
              </h2>
            </div>
            <span className="rounded-full bg-surface-elevated px-3 py-1 font-display text-caption font-semibold text-muted border border-border">
              {preparingOrders.length} Active
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {preparingOrders.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface-elevated/40 p-6 text-center text-caption text-muted">
                No orders currently in prep.
              </div>
            ) : (
              preparingOrders.map((order) => (
                <VendorOrderCard
                  key={order.id}
                  order={order}
                  onAdvanceStatus={onAdvanceStatus}
                />
              ))
            )}
          </div>
        </div>

        {/* READY FOR PICKUP COLUMN */}
        <div
          className={`flex flex-col gap-4 ${
            mobileTab !== "ready" ? "hidden sm:flex" : "flex"
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-success" />
              <h2 className="font-display text-heading font-bold text-foreground">
                Ready
              </h2>
            </div>
            <span className="rounded-full bg-success/10 px-3 py-1 font-display text-caption font-semibold text-success border border-success/30">
              {readyOrders.length} Waiting
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {readyOrders.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface-elevated/40 p-6 text-center text-caption text-muted">
                No orders waiting for pickup.
              </div>
            ) : (
              readyOrders.map((order) => (
                <VendorOrderCard
                  key={order.id}
                  order={order}
                  onAdvanceStatus={onAdvanceStatus}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
