"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  MOCK_VENDOR_STORE,
  MOCK_VENDOR_STATS,
  type VendorOrder,
  type VendorOrderStatus,
} from "@/lib/mock/vendor";
import { VendorHeader } from "@/components/vendor/orders/VendorHeader";
import { VendorStatsBar } from "@/components/vendor/orders/VendorStatsBar";
import { VendorOrdersBoard } from "@/components/vendor/orders/VendorOrdersBoard";
import { VendorNotificationsDrawer } from "@/components/vendor/notifications/VendorNotificationsDrawer";
import { getLiveVendorOrders } from "@/lib/supabase/vendor_orders";
import { createClient } from "@/lib/supabase/client";

function playNotificationChime() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignore if audio permissions block sound
  }
}

export default function VendorActiveOrdersPage() {
  const [store, setStore] = useState(MOCK_VENDOR_STORE);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    const liveOrders = await getLiveVendorOrders();
    setOrders(liveOrders);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    getLiveVendorOrders().then((liveOrders) => {
      if (isMounted) {
        setOrders(liveOrders);
        setIsLoading(false);
      }
    });

    // Supabase Realtime Subscription for incoming vendor orders
    const supabase = createClient();
    const channel = supabase
      .channel("vendor-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          playNotificationChime();
          showNotification("Orders updated in real time!");
          fetchOrders();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const handleToggleStoreStatus = () => {
    setStore((prev) => {
      const nextOpen = !prev.isOpen;
      showNotification(`Store status changed to ${nextOpen ? "OPEN" : "CLOSED"}`);
      return { ...prev, isOpen: nextOpen };
    });
  };

  const handleChangePrepTime = () => {
    const options = [10, 12, 15, 20];
    const currentIndex = options.indexOf(store.prepTimeMinutes);
    const nextPrepTime = options[(currentIndex + 1) % options.length];
    setStore((prev) => ({ ...prev, prepTimeMinutes: nextPrepTime }));
    showNotification(`Default prep time updated to ${nextPrepTime} mins`);
  };

  const handleAdvanceOrderStatus = async (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    let nextStatus: VendorOrderStatus = targetOrder.status;
    if (targetOrder.status === "placed") nextStatus = "preparing";
    else if (targetOrder.status === "preparing") nextStatus = "ready";
    else if (targetOrder.status === "ready") nextStatus = "picked_up";
    else if (targetOrder.status === "picked_up") nextStatus = "completed";

    if (nextStatus === targetOrder.status) return;

    try {
      const response = await fetch(`/api/vendor/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        showNotification(data.error ?? "Failed to update order status.");
        fetchOrders();
        return;
      }

      showNotification(
        `Order ${targetOrder.orderNumber} advanced to ${
          nextStatus === "preparing"
            ? "ACCEPTED"
            : nextStatus === "ready"
              ? "READY FOR PICKUP"
              : nextStatus === "picked_up"
                ? "PICKED UP"
                : "COMPLETED"
        }`,
      );
      fetchOrders();
    } catch {
      showNotification("Network error updating order status.");
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    try {
      const response = await fetch(`/api/vendor/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", reason }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        showNotification(data.error ?? "Failed to cancel order.");
        fetchOrders();
        return;
      }

      showNotification(`Order ${targetOrder.orderNumber} CANCELLED.`);
      fetchOrders();
    } catch {
      showNotification("Network error cancelling order.");
    }
  };

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "cancelled"),
    [orders],
  );

  const computedStats = useMemo(() => {
    const pendingCount = orders.filter(
      (o) => o.status === "placed" || o.status === "preparing",
    ).length;
    const readyCount = orders.filter((o) => o.status === "ready").length;
    const completedOrders = orders.filter(
      (o) => o.status === "completed" || o.status === "picked_up",
    );
    const liveRevenue = completedOrders.reduce((sum) => sum + 140, 4250);

    return {
      ...MOCK_VENDOR_STATS,
      pendingOrders: pendingCount,
      readyOrders: readyCount,
      dailyRevenue: liveRevenue,
    };
  }, [orders]);

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <VendorHeader
        store={store}
        onToggleStatus={handleToggleStoreStatus}
        onChangePrepTime={handleChangePrepTime}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      <main className="flex-1 p-4 sm:p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {notification && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-body-sm font-semibold text-primary animate-fade-in">
            {notification}
          </div>
        )}

        <VendorStatsBar stats={computedStats} />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined text-[32px] text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-body-sm text-muted">Loading live canteen orders from Supabase...</p>
          </div>
        ) : (
          <VendorOrdersBoard
            orders={activeOrders}
            onAdvanceStatus={handleAdvanceOrderStatus}
            onCancelOrder={handleCancelOrder}
          />
        )}
      </main>

      <VendorNotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectOrder={() => {
          fetchOrders();
        }}
      />
    </div>
  );
}
