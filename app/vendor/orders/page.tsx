"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  type VendorOrder,
  type VendorOrderStatus,
  type VendorStoreConfig,
} from "@/lib/mock/vendor";
import { VendorHeader } from "@/components/vendor/orders/VendorHeader";
import { VendorMoreFeaturesSheet } from "@/components/vendor/orders/VendorMoreFeaturesSheet";
import { VendorMobileNavMenu } from "@/components/vendor/orders/VendorMobileNavMenu";
import { VendorProfileSheet } from "@/components/vendor/orders/VendorProfileSheet";
import { VENDOR_NAV } from "@/app/vendor/layout";
import { VendorOrdersBoard } from "@/components/vendor/orders/VendorOrdersBoard";
import { VendorNotificationsDrawer } from "@/components/vendor/notifications/VendorNotificationsDrawer";
import { IncomingOrderAlert } from "@/components/vendor/orders/IncomingOrderAlert";
// Camera/canvas QR decoding (jsQR) is only needed once the vendor opens
// the scanner sheet — deferring it out of this page's initial bundle.
const VendorQrScanner = dynamic(
  () => import("@/components/vendor/orders/VendorQrScanner").then((m) => m.VendorQrScanner),
  { ssr: false },
);
import { VendorOrdersFilterBar } from "@/components/vendor/orders/VendorOrdersFilterBar";
import { VendorOrderDetailModal } from "@/components/vendor/orders/VendorOrderDetailModal";
import { ThermalPrinterModal } from "@/components/vendor/printer/ThermalPrinterModal";
import { getLiveVendorOrders } from "@/lib/supabase/vendor_orders";
import { useVendor } from "@/lib/vendor/VendorContext";
import { createClient } from "@/lib/supabase/client";
import { useOrderAlertSound } from "@/lib/vendor/useOrderAlertSound";
import { hardNavigate } from "@/lib/auth/redirect";
import { syncSingleManualOrder } from "@/lib/offline/manual_order_sync";
import { setDesiredStatus } from "@/lib/offline/manual_order_db";
import {
  isOrderAlreadyAlerted,
  markOrderAlerted,
  getPendingOrderNavigation,
  clearPendingOrderNavigation,
  onOrderNotificationTapped,
} from "@/lib/vendor/orderAlertService";

const TAB_TITLE_DEFAULT = "Live Orders — GRABIT Vendor";
const TAB_TITLE_ALERT = "🔔 NEW ORDER — GRABIT Vendor";

export default function VendorLiveOrdersPage() {
  const { store, setStore, canteenId, pauseStatus } = useVendor();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modals & Drawers
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMoreFeaturesOpen, setIsMoreFeaturesOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPrinterSetupOpen, setIsPrinterSetupOpen] = useState(false);
  const [scannerInitialMode, setScannerInitialMode] = useState<"qr" | "otp">("qr");

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");
  const [selectedDate, setSelectedDate] = useState("today");

  const sound = useOrderAlertSound();
  const soundRef = useRef(sound);
  useEffect(() => {
    soundRef.current = sound;
  });
  const alertedOrderIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedOnceRef = useRef(false);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Notification-tap deep links can arrive before the live orders list has
  // finished loading (cold start especially: this effect and the orders
  // fetch both kick off on mount, racing). Rather than looking the order up
  // in a state snapshot that's still empty, the target id is parked here and
  // resolved every time fresh orders come in via applyOrders, so it survives
  // until the order it points to actually exists in state.
  const pendingNotificationOrderIdRef = useRef<string | null>(null);

  const openOrderById = useCallback((orderId: string) => {
    if (!orderId) return;
    setOrders((currentOrders) => {
      const match = currentOrders.find((o) => o.id === orderId);
      if (match) {
        setSelectedOrder(match);
        setIsDetailModalOpen(true);
        pendingNotificationOrderIdRef.current = null;
      } else {
        pendingNotificationOrderIdRef.current = orderId;
      }
      return currentOrders;
    });
  }, []);

  useEffect(() => {
    getPendingOrderNavigation().then((res) => {
      if (res.pending && res.orderId) {
        openOrderById(res.orderId);
        clearPendingOrderNavigation();
      }
    });

    let cleanupListener: (() => void) | null = null;
    onOrderNotificationTapped((data) => {
      if (data && data.orderId) {
        openOrderById(data.orderId);
      }
    }).then((unsub) => {
      cleanupListener = unsub;
    });

    return () => {
      if (cleanupListener) cleanupListener();
    };
  }, [openOrderById]);

  const applyOrders = useCallback((liveOrders: VendorOrder[]) => {
    setOrders(liveOrders);

    const pendingId = pendingNotificationOrderIdRef.current;
    if (pendingId) {
      const match = liveOrders.find((o) => o.id === pendingId);
      if (match) {
        setSelectedOrder(match);
        setIsDetailModalOpen(true);
        pendingNotificationOrderIdRef.current = null;
      }
    }

    const currentPlacedIds = liveOrders
      .filter((o) => o.status === "placed" && !o.isManual)
      .map((o) => o.id);

    if (!hasLoadedOnceRef.current) {
      currentPlacedIds.forEach((id) => {
        alertedOrderIdsRef.current.add(id);
        markOrderAlerted(id);
      });
      hasLoadedOnceRef.current = true;
      return;
    }

    const genuinelyNewIds = currentPlacedIds.filter(
      (id) => !alertedOrderIdsRef.current.has(id) && !isOrderAlreadyAlerted(id),
    );
    currentPlacedIds.forEach((id) => {
      alertedOrderIdsRef.current.add(id);
      markOrderAlerted(id);
    });

    if (genuinelyNewIds.length > 0) {
      soundRef.current.start();
    }
  }, []);


  const fetchOrders = useCallback(async () => {
    if (!canteenId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setIsError(false);
    try {
      const liveOrders = await getLiveVendorOrders(canteenId);
      applyOrders(liveOrders);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [canteenId, applyOrders]);

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;

    if (!canteenId) {
      return;
    }

    getLiveVendorOrders(canteenId).then((liveOrders) => {
      if (isMounted) {
        applyOrders(liveOrders);
        setIsLoading(false);
      }
    });

    const supabase = createClient();
    channel = supabase
      .channel(`vendor-live-orders-realtime-${canteenId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `canteen_id=eq.${canteenId}` },
        () => {
          fetchOrders();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
      sound.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canteenId]);

  const pendingPlacedOrders = useMemo(
    () => orders.filter((o) => o.status === "placed"),
    [orders],
  );

  useEffect(() => {
    if (pendingPlacedOrders.length === 0) {
      sound.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPlacedOrders.length]);

  useEffect(() => {
    document.title = pendingPlacedOrders.length > 0 ? TAB_TITLE_ALERT : TAB_TITLE_DEFAULT;
    return () => {
      document.title = TAB_TITLE_DEFAULT;
    };
  }, [pendingPlacedOrders.length]);

  const handleToggleStoreStatus = useCallback(() => {
    setStore((prev: VendorStoreConfig) => {
      const nextOpen = !prev.isOpen;
      showNotification(`Store status changed to ${nextOpen ? "OPEN" : "CLOSED"}`);
      return { ...prev, isOpen: nextOpen };
    });
  }, [setStore, showNotification]);

  const handleChangePrepTime = useCallback(() => {
    const options = [10, 12, 15, 20];
    setStore((prev: VendorStoreConfig) => {
      const currentIndex = options.indexOf(prev.prepTimeMinutes);
      const nextPrepTime = options[(currentIndex + 1) % options.length];
      showNotification(`Default prep time updated to ${nextPrepTime} mins`);
      return { ...prev, prepTimeMinutes: nextPrepTime };
    });
  }, [setStore, showNotification]);

  const handleAuthExpired = useCallback(() => {
    soundRef.current.stop();
    setActionError("Your vendor session expired. Please sign in again to manage orders.");
    showNotification("Session expired — redirecting to sign in…");
    setTimeout(() => hardNavigate("/vendor/auth?next=%2Fvendor%2Forders"), 2500);
  }, [showNotification]);

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

    let targetId = orderId;
    if (orderId.startsWith("manual_client_")) {
      const syncResult = await syncSingleManualOrder(orderId, canteenId ?? undefined);
      if (!syncResult.ok) {
        await setDesiredStatus(orderId, nextStatus);
        const msg =
          syncResult.reason === "offline"
            ? "Still offline — this order will sync and the status change will be applied automatically once it does."
            : syncResult.error || "Unable to sync this order right now. The status change is queued.";
        showNotification(msg);
        fetchOrders();
        return;
      }
      targetId = syncResult.serverOrderId;
    }

    try {
      const response = await fetch(`/api/vendor/orders/${targetId}`, {
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

  // Filtered orders derivation
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Search query filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.studentName.toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q));

      // Status filter
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "completed"
          ? o.status === "completed" || o.status === "picked_up"
          : o.status === selectedStatus);

      // Payment filter
      const matchesPayment =
        selectedPayment === "all" || o.paymentType === selectedPayment;

      // Date filter
      let matchesDate = true;
      if (selectedDate !== "all" && o.createdAtIso) {
        const orderDate = new Date(o.createdAtIso);
        const now = new Date();
        if (selectedDate === "today") {
          matchesDate = orderDate.toDateString() === now.toDateString();
        } else if (selectedDate === "yesterday") {
          const yest = new Date();
          yest.setDate(now.getDate() - 1);
          matchesDate = orderDate.toDateString() === yest.toDateString();
        } else if (selectedDate === "7d") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          matchesDate = orderDate >= sevenDaysAgo;
        }
      }

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [orders, searchQuery, selectedStatus, selectedPayment, selectedDate]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedPayment("all");
    setSelectedDate("today");
  }, []);

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
        onOpenMoreFeatures={() => setIsMoreFeaturesOpen(true)}
        onOpenNavMenu={() => setIsNavMenuOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        pendingOrderCount={pendingPlacedOrders.length}
      />

      <VendorMobileNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        items={VENDOR_NAV}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <VendorMoreFeaturesSheet
        isOpen={isMoreFeaturesOpen}
        onClose={() => setIsMoreFeaturesOpen(false)}
        store={store}
        onToggleStatus={handleToggleStoreStatus}
        onChangePrepTime={handleChangePrepTime}
        isSoundUnlocked={sound.isUnlocked}
        onUnlockSound={sound.unlock}
        onOpenPrinterSetup={() => setIsPrinterSetupOpen(true)}
      />

      <VendorProfileSheet
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        store={store}
      />

      <main className="flex-1 p-4 sm:p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full pb-24 sm:pb-8">
        {pauseStatus?.isPaused && (
          <div className="flex flex-col gap-1 rounded-xl border border-warning/40 bg-warning/10 p-4">
            <span className="font-display text-body-sm font-extrabold uppercase tracking-wider text-warning">
              Store Paused by Super Admin
            </span>
            {pauseStatus.reason && (
              <span className="text-caption text-warning/80">Reason: {pauseStatus.reason}</span>
            )}
            <span className="text-caption text-muted">
              Customers cannot place new orders until this is lifted.
            </span>
          </div>
        )}

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

        {/* Header Title & Scanner Trigger */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-title font-extrabold text-foreground sm:text-display">
              Live Order Management
            </h1>
            <p className="text-caption text-muted">
              Real-time kitchen order queue & status operations
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setScannerInitialMode("qr");
              setIsScannerOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-body-sm font-extrabold text-on-primary shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            Scan Order QR / OTP
          </button>
        </div>

        {/* Filter Bar */}
        <VendorOrdersFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedPayment={selectedPayment}
          onPaymentChange={setSelectedPayment}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onResetFilters={handleResetFilters}
          totalFilteredCount={filteredOrders.length}
        />

        {/* Orders Kanban Board */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="material-symbols-outlined text-[36px] text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-body-sm text-muted">Loading live canteen orders from Supabase...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-12 text-center">
            <span className="material-symbols-outlined text-[40px] text-danger">
              error
            </span>
            <h3 className="font-display text-title font-bold text-foreground">
              Unable to load live orders
            </h3>
            <p className="text-caption text-muted">
              Check your network connection and try again.
            </p>
            <button
              type="button"
              onClick={fetchOrders}
              className="mt-2 rounded-xl bg-primary px-5 py-2.5 font-display text-caption font-bold text-on-primary"
            >
              Retry Load
            </button>
          </div>
        ) : (
          <VendorOrdersBoard
            orders={filteredOrders}
            vendorName={store.name}
            onAdvanceStatus={handleAdvanceOrderStatus}
            onCancelOrder={handleCancelOrder}
            onSelectOrder={(order) => {
              setSelectedOrder(order);
              setIsDetailModalOpen(true);
            }}
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
        initialMode={scannerInitialMode}
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

      <VendorOrderDetailModal
        order={selectedOrder}
        isOpen={isDetailModalOpen}
        vendorName={store.name}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOrder(null);
        }}
        onAdvanceStatus={handleAdvanceOrderStatus}
        onCancelOrder={handleCancelOrder}
      />

      <ThermalPrinterModal
        open={isPrinterSetupOpen}
        onClose={() => setIsPrinterSetupOpen(false)}
      />
    </div>
  );
}
