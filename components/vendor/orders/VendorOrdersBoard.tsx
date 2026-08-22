"use client";

import { useState } from "react";
import type { VendorOrder, VendorOrderStatus } from "@/lib/mock/vendor";
import { VendorOrderCard } from "@/components/vendor/orders/VendorOrderCard";

interface VendorOrdersBoardProps {
  orders: VendorOrder[];
  vendorName: string;
  onAdvanceStatus: (orderId: string) => Promise<void> | void;
  onCancelOrder?: (orderId: string, reason: string) => Promise<void>;
  onSelectOrder?: (order: VendorOrder) => void;
}

export function VendorOrdersBoard({
  orders,
  vendorName,
  onAdvanceStatus,
  onCancelOrder,
  onSelectOrder,
}: VendorOrdersBoardProps) {
  const [mobileTab, setMobileTab] = useState<VendorOrderStatus>("placed");

  const newOrders = orders.filter((o) => o.status === "placed");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const completedOrders = orders.filter(
    (o) => o.status === "picked_up" || o.status === "completed",
  );

  return (
    <section className="flex flex-col gap-4">
      {/* Mobile Tab Filter Bar */}
      <div className="flex gap-1.5 sm:hidden border-b border-border pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setMobileTab("placed")}
          className={`flex-1 min-w-[75px] rounded-xl py-2 px-2 font-display text-caption font-bold transition-all text-center ${
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
          className={`flex-1 min-w-[85px] rounded-xl py-2 px-2 font-display text-caption font-bold transition-all text-center ${
            mobileTab === "preparing"
              ? "bg-primary text-on-primary"
              : "bg-surface-elevated text-muted"
          }`}
        >
          Prep ({preparingOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("ready")}
          className={`flex-1 min-w-[80px] rounded-xl py-2 px-2 font-display text-caption font-bold transition-all text-center ${
            mobileTab === "ready"
              ? "bg-success text-black"
              : "bg-surface-elevated text-muted"
          }`}
        >
          Ready ({readyOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("completed")}
          className={`flex-1 min-w-[90px] rounded-xl py-2 px-2 font-display text-caption font-bold transition-all text-center ${
            mobileTab === "completed" || mobileTab === "picked_up"
              ? "bg-surface text-foreground border border-border"
              : "bg-surface-elevated text-muted"
          }`}
        >
          Done ({completedOrders.length})
        </button>
      </div>

      {/* Kanban Grid (4 Columns on Desktop/Tablet) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* NEW ORDERS COLUMN */}
        <div
          className={`flex flex-col gap-4 ${
            mobileTab !== "placed" ? "hidden sm:flex" : "flex"
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-primary animate-ping" />
              <h2 className="font-display text-body-sm font-bold text-foreground uppercase tracking-wider">
                New Orders
              </h2>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-display text-caption font-semibold text-primary">
              {newOrders.length}
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
                  vendorName={vendorName}
                  onAdvanceStatus={onAdvanceStatus}
                  onCancelOrder={onCancelOrder}
                  onSelectOrder={onSelectOrder}
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
              <h2 className="font-display text-body-sm font-bold text-foreground uppercase tracking-wider">
                Preparing
              </h2>
            </div>
            <span className="rounded-full bg-surface-elevated px-2.5 py-0.5 font-display text-caption font-semibold text-muted border border-border">
              {preparingOrders.length}
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
                  vendorName={vendorName}
                  onAdvanceStatus={onAdvanceStatus}
                  onCancelOrder={onCancelOrder}
                  onSelectOrder={onSelectOrder}
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
              <h2 className="font-display text-body-sm font-bold text-foreground uppercase tracking-wider">
                Ready for Pickup
              </h2>
            </div>
            <span className="rounded-full bg-success/10 px-2.5 py-0.5 font-display text-caption font-semibold text-success border border-success/30">
              {readyOrders.length}
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
                  vendorName={vendorName}
                  onAdvanceStatus={onAdvanceStatus}
                  onCancelOrder={onCancelOrder}
                  onSelectOrder={onSelectOrder}
                />
              ))
            )}
          </div>
        </div>

        {/* COMPLETED & PICKED UP COLUMN */}
        <div
          className={`flex flex-col gap-4 ${
            mobileTab !== "completed" && mobileTab !== "picked_up"
              ? "hidden sm:flex"
              : "flex"
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-muted" />
              <h2 className="font-display text-body-sm font-bold text-foreground uppercase tracking-wider">
                Completed
              </h2>
            </div>
            <span className="rounded-full bg-surface-elevated px-2.5 py-0.5 font-display text-caption font-semibold text-faint border border-border">
              {completedOrders.length}
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {completedOrders.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface-elevated/40 p-6 text-center text-caption text-muted">
                No completed orders today.
              </div>
            ) : (
              completedOrders.map((order) => (
                <VendorOrderCard
                  key={order.id}
                  order={order}
                  vendorName={vendorName}
                  onAdvanceStatus={onAdvanceStatus}
                  onCancelOrder={onCancelOrder}
                  onSelectOrder={onSelectOrder}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
