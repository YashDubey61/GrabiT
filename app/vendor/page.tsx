"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MOCK_VENDOR_STORE,
  MOCK_VENDOR_STATS,
  type VendorOrder,
  type VendorOrderStatus,
} from "@/lib/mock/vendor";
import { VendorHeader } from "@/components/vendor/orders/VendorHeader";
import { VendorStatsBar } from "@/components/vendor/orders/VendorStatsBar";
import { VendorOrdersBoard } from "@/components/vendor/orders/VendorOrdersBoard";
import { getLiveVendorOrders } from "@/lib/supabase/vendor_orders";

export default function VendorActiveOrdersPage() {
  const [store, setStore] = useState(MOCK_VENDOR_STORE);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadVendorOrders = async () => {
    setIsLoading(true);
    const liveOrders = await getLiveVendorOrders();
    setOrders(liveOrders);
    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadVendorOrders();
  }, []);

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
    else if (targetOrder.status === "ready") nextStatus = "completed";

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
        return;
      }

      showNotification(`Order ${targetOrder.orderNumber} advanced to ${nextStatus.toUpperCase()}`);
      loadVendorOrders();
    } catch {
      showNotification("Network error updating order status.");
    }
  };

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "completed"),
    [orders],
  );

  const computedStats = useMemo(() => {
    const pendingCount = orders.filter((o) => o.status === "placed" || o.status === "preparing").length;
    const readyCount = orders.filter((o) => o.status === "ready").length;
    const completedOrders = orders.filter((o) => o.status === "completed");
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
        onOpenNotifications={() => showNotification("Notifications panel opened")}
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
          />
        )}
      </main>
    </div>
  );
}
