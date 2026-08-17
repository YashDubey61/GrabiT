"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
import { IncomingOrderAlert } from "@/components/vendor/orders/IncomingOrderAlert";
import { VendorQrScanner } from "@/components/vendor/orders/VendorQrScanner";
import { getLiveVendorOrders } from "@/lib/supabase/vendor_orders";
import { getLiveVendorCanteenId } from "@/lib/supabase/vendor_context";
import { createClient } from "@/lib/supabase/client";
import { useOrderAlertSound } from "@/lib/vendor/useOrderAlertSound";
import { hardNavigate } from "@/lib/auth/redirect";

const TAB_TITLE_DEFAULT = "GrabIt Vendor";
const TAB_TITLE_ALERT = "🔔 NEW ORDER — GRABIT Vendor";

export default function VendorActiveOrdersPage() {
  const [store, setStore] = useState(MOCK_VENDOR_STORE);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const canteenIdRef = useRef<string | null>(null);

  // Order-alert ringing: alertedOrderIds tracks every "placed" order id
  // we've already reacted to (rung for or seen on initial load), so
  // duplicate realtime events / re-renders never start a second ring for
  // the same order. hasLoadedOnceRef distinguishes "orders that were
  // already pending when the dashboard opened" (shown, never rung) from
  // "orders that arrived after" (shown AND rung) — see req #10.
  const sound = useOrderAlertSound();
  // The realtime subscription below is set up once (mount-only effect) so
  // it never has to tear down and reconnect; that means any callback it
  // captures is frozen at mount time. `soundRef` always points at the
  // latest sound-hook object so calls made from inside that stale closure
  // (fetchOrders -> applyOrders -> sound.start) still see the current
  // isUnlocked/start/stop, not the mount-time snapshot.
  const soundRef = useRef(sound);
  useEffect(() => {
    soundRef.current = sound;
  });
  const alertedOrderIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedOnceRef = useRef(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const applyOrders = useCallback((liveOrders: VendorOrder[]) => {
    setOrders(liveOrders);

    const currentPlacedIds = liveOrders
      .filter((o) => o.status === "placed")
      .map((o) => o.id);

    if (!hasLoadedOnceRef.current) {
      // First load: these are pre-existing pending orders, not new
      // arrivals — mark them seen without ringing (req #10).
      currentPlacedIds.forEach((id) => alertedOrderIdsRef.current.add(id));
      hasLoadedOnceRef.current = true;
      return;
    }

    const genuinelyNewIds = currentPlacedIds.filter(
      (id) => !alertedOrderIdsRef.current.has(id),
    );
    currentPlacedIds.forEach((id) => alertedOrderIdsRef.current.add(id));

    if (genuinelyNewIds.length > 0) {
      soundRef.current.start();
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    const liveOrders = canteenIdRef.current
      ? await getLiveVendorOrders(canteenIdRef.current)
      : [];
    applyOrders(liveOrders);
    setIsLoading(false);
  }, [applyOrders]);

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    const supabase = createClient();

    getLiveVendorCanteenId().then((id) => {
      if (!isMounted) return;
      canteenIdRef.current = id;

      getLiveVendorOrders(id ?? undefined).then((liveOrders) => {
        if (isMounted) {
          applyOrders(liveOrders);
          setIsLoading(false);
        }
      });

      if (!id) return;

      // Realtime, scoped strictly to this vendor's own canteen — never
      // subscribe to platform-wide order events (vendor isolation, req #16).
      channel = supabase
        .channel(`vendor-orders-realtime-${id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders", filter: `canteen_id=eq.${id}` },
          () => {
            fetchOrders();
          },
        )
        .subscribe();
    });

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
      sound.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingPlacedOrders = useMemo(
    () => orders.filter((o) => o.status === "placed"),
    [orders],
  );

  // Stop ringing the instant there's nothing left to act on — covers
  // accept, reject, external cancellation, or the order simply leaving
  // the "placed" state (req #7).
  useEffect(() => {
    if (pendingPlacedOrders.length === 0) {
      sound.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPlacedOrders.length]);

  // Tab title flashes while any order is awaiting vendor action (req #11).
  useEffect(() => {
    document.title = pendingPlacedOrders.length > 0 ? TAB_TITLE_ALERT : TAB_TITLE_DEFAULT;
    return () => {
      document.title = TAB_TITLE_DEFAULT;
    };
  }, [pendingPlacedOrders.length]);

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

  // A 401 means the vendor's server-side session is gone/expired. The
  // dashboard can still *look* alive (order reads go through the browser
  // client), so this must be surfaced loudly and the ring stopped —
  // otherwise the vendor clicks Accept forever with no feedback.
  const handleAuthExpired = useCallback(() => {
    soundRef.current.stop();
    setActionError("Your vendor session expired. Please sign in again to manage orders.");
    showNotification("Session expired — redirecting to sign in…");
    setTimeout(() => hardNavigate("/vendor/auth?next=%2Fvendor"), 2500);
  }, []);

  const handleAdvanceOrderStatus = async (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    let nextStatus: VendorOrderStatus = targetOrder.status;
    if (targetOrder.status === "placed") nextStatus = "preparing";
    else if (targetOrder.status === "preparing") nextStatus = "ready";
    else if (targetOrder.status === "ready") nextStatus = "picked_up";
    else if (targetOrder.status === "picked_up") nextStatus = "completed";

    if (nextStatus === targetOrder.status) return;

    setActionError(null);
    try {
      const response = await fetch(`/api/vendor/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (response.status === 401) {
        handleAuthExpired();
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.ok) {
        const msg = data.error ?? "Failed to update order status.";
        setActionError(msg);
        showNotification(msg);
        fetchOrders();
        return;
      }

      showNotification(
        targetOrder.status === "placed" && nextStatus === "preparing"
          ? `Order ${targetOrder.orderNumber} accepted`
          : `Order ${targetOrder.orderNumber} advanced to ${
              nextStatus === "ready"
                ? "READY FOR PICKUP"
                : nextStatus === "picked_up"
                  ? "PICKED UP"
                  : "COMPLETED"
            }`,
      );
      fetchOrders();
    } catch {
      const msg = "Network error updating order status.";
      setActionError(msg);
      showNotification(msg);
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    setActionError(null);
    try {
      const response = await fetch(`/api/vendor/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", reason }),
      });

      if (response.status === 401) {
        handleAuthExpired();
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.ok) {
        const msg = data.error ?? "Failed to cancel order.";
        setActionError(msg);
        showNotification(msg);
        fetchOrders();
        return;
      }

      showNotification(
        targetOrder.status === "placed"
          ? `Order ${targetOrder.orderNumber} rejected`
          : `Order ${targetOrder.orderNumber} CANCELLED.`,
      );
      fetchOrders();
    } catch {
      const msg = "Network error cancelling order.";
      setActionError(msg);
      showNotification(msg);
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
    <div
      className="min-h-dvh bg-background text-foreground flex flex-col"
      onClickCapture={sound.isUnlocked ? undefined : sound.unlock}
    >
      <VendorHeader
        store={store}
        onToggleStatus={handleToggleStoreStatus}
        onChangePrepTime={handleChangePrepTime}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        pendingOrderCount={pendingPlacedOrders.length}
      />

      <main className="flex-1 p-4 sm:p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {notification && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-body-sm font-semibold text-primary animate-fade-in">
            {notification}
          </div>
        )}

        {!sound.isUnlocked && pendingPlacedOrders.length > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/10 p-3">
            <span className="text-body-sm font-semibold text-foreground">
              Enable sound to receive order alerts.
            </span>
            <button
              type="button"
              onClick={sound.unlock}
              className="shrink-0 rounded-lg bg-primary px-4 py-2 font-display text-caption font-extrabold uppercase tracking-wider text-on-primary hover:opacity-90 active:scale-95"
            >
              Enable Sound
            </button>
          </div>
        )}

        {sound.isUnlocked && pendingPlacedOrders.length > 0 && !sound.isRinging && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated p-3">
            <span className="text-body-sm font-semibold text-foreground">
              You have {pendingPlacedOrders.length} pending order
              {pendingPlacedOrders.length > 1 ? "s" : ""}.
            </span>
            <button
              type="button"
              onClick={sound.start}
              className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 font-display text-caption font-extrabold uppercase tracking-wider text-primary hover:bg-primary/10 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">volume_up</span>
              Play Alert
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 py-3.5 font-display text-body-sm font-extrabold uppercase tracking-widest text-primary transition-all active:scale-[0.98] hover:bg-primary/20"
        >
          <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
          Scan Order QR
        </button>

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

      <IncomingOrderAlert
        pendingOrders={pendingPlacedOrders}
        onAccept={handleAdvanceOrderStatus}
        onReject={handleCancelOrder}
        errorMessage={actionError}
      />

      <VendorQrScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCompleted={(orderNumber) => {
          showNotification(`Order ${orderNumber} completed`);
          fetchOrders();
        }}
      />

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
