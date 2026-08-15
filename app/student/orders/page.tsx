"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useOrders } from "@/lib/orders/OrderContext";
import type { Order, OrderStatus } from "@/lib/orders/types";
import { OrderHistoryCard } from "@/components/student/order/OrderHistoryCard";
import { EmptyOrderHistoryState } from "@/components/student/order/EmptyOrderHistoryState";
import { getLiveOrdersForStudent } from "@/lib/supabase/orders";

type FilterTab = "all" | "ongoing" | "completed" | "cancelled";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All Orders" },
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

function isOngoingStatus(status: OrderStatus): boolean {
  return status === "placed" || status === "preparing" || status === "ready";
}

export default function StudentOrderHistoryPage() {
  const { getOrdersForStudent } = useOrders();
  const localOrders = getOrdersForStudent();
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  useEffect(() => {
    let isMounted = true;
    async function loadOrders() {
      setIsLoading(true);
      const dbOrders = await getLiveOrdersForStudent();
      if (isMounted) {
        if (dbOrders && dbOrders.length > 0) {
          setLiveOrders(dbOrders);
        } else {
          setLiveOrders(localOrders);
        }
        setIsLoading(false);
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [localOrders]);

  const rawOrders = liveOrders.length > 0 ? liveOrders : localOrders;

  // Newest orders first (createdAt DESC)
  const sortedOrders = useMemo(() => {
    return [...rawOrders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [rawOrders]);

  const filteredOrders = useMemo(() => {
    switch (activeFilter) {
      case "ongoing":
        return sortedOrders.filter((order) => isOngoingStatus(order.status));
      case "completed":
        return sortedOrders.filter((order) => order.status === "completed");
      case "cancelled":
        return sortedOrders.filter((order) => order.status === "cancelled");
      case "all":
      default:
        return sortedOrders;
    }
  }, [sortedOrders, activeFilter]);

  return (
    <>
      {/* Sticky Header Bar */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/50 bg-background/90 px-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/student"
            aria-label="Back to home"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-elevated hover:text-foreground active:scale-95"
          >
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
              arrow_back
            </span>
          </Link>
          <h1 className="font-display text-title font-bold tracking-tight text-primary">
            Your Orders
          </h1>
        </div>

        {rawOrders.length > 0 && (
          <span className="rounded-full bg-primary/10 px-3 py-1 font-display text-caption font-semibold text-primary">
            {rawOrders.length} {rawOrders.length === 1 ? "Order" : "Orders"}
          </span>
        )}
      </header>

      {/* Main Content Area */}
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-24 pt-6 sm:px-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined text-[32px] text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-body-sm text-muted">Loading your order history from Supabase...</p>
          </div>
        ) : rawOrders.length === 0 ? (
          <EmptyOrderHistoryState />
        ) : (
          <>
            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {FILTER_TABS.map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 font-display text-caption font-semibold transition-all duration-150 active:scale-95 ${
                      isActive
                        ? "bg-primary text-on-primary shadow-glow-primary"
                        : "border border-border bg-surface-elevated text-muted hover:border-white/20 hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface-elevated/50 p-8 text-center backdrop-blur-md">
                <p className="text-body-sm text-muted">
                  No orders found in the &ldquo;{activeFilter}&rdquo; category.
                </p>
                <button
                  onClick={() => setActiveFilter("all")}
                  className="mt-3 font-display text-caption font-bold text-primary underline underline-offset-4 hover:text-primary-soft"
                >
                  Show all orders
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredOrders.map((order) => (
                  <OrderHistoryCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
