"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  type VendorOrder,
  type VendorOrderStatus,
  type VendorMenuItem,
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
// the scanner sheet — deferring it out of the dashboard's initial bundle.
// ssr:false is required (and safe) since it touches browser-only camera APIs.
const VendorQrScanner = dynamic(
  () => import("@/components/vendor/orders/VendorQrScanner").then((m) => m.VendorQrScanner),
  { ssr: false },
);
import { VendorMenuItemModal } from "@/components/vendor/menu/VendorMenuItemModal";
import { VendorMetricCards } from "@/components/vendor/dashboard/VendorMetricCards";
import { VendorLiveOrderOverview } from "@/components/vendor/dashboard/VendorLiveOrderOverview";
import { VendorSalesChart } from "@/components/vendor/dashboard/VendorSalesChart";
import { VendorTopSellingItems } from "@/components/vendor/dashboard/VendorTopSellingItems";
import { VendorLowStockAlerts } from "@/components/vendor/dashboard/VendorLowStockAlerts";
import { VendorQuickActions } from "@/components/vendor/dashboard/VendorQuickActions";
import { VendorRecentActivity } from "@/components/vendor/dashboard/VendorRecentActivity";
import { ManualCashOrderModal } from "@/components/vendor/orders/ManualCashOrderModal";
import { initAutomaticManualOrderSync, syncSingleManualOrder } from "@/lib/offline/manual_order_sync";
import { cacheVendorMenuLocally, setDesiredStatus } from "@/lib/offline/manual_order_db";
import { getLiveVendorOrders } from "@/lib/supabase/vendor_orders";
import {
  addLiveVendorMenuItem,
  getLiveVendorMenuItems,
  toggleLiveVendorMenuItemStock,
} from "@/lib/supabase/vendor_menu";
import { getLiveVendorCategories } from "@/lib/supabase/vendor_categories";
import {
  getLiveVendorAnalytics,
  type LiveVendorAnalyticsData,
} from "@/lib/supabase/vendor_analytics";
import { useVendor } from "@/lib/vendor/VendorContext";
import { createClient } from "@/lib/supabase/client";
import { useOrderAlertSound } from "@/lib/vendor/useOrderAlertSound";
import { hardNavigate } from "@/lib/auth/redirect";

const TAB_TITLE_DEFAULT = "GrabIt Vendor";
const TAB_TITLE_ALERT = "🔔 NEW ORDER — GRABIT Vendor";

export default function VendorActiveOrdersPage() {
  const { store, setStore, canteenId, pauseStatus } = useVendor();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMoreFeaturesOpen, setIsMoreFeaturesOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scannerInitialMode, setScannerInitialMode] = useState<"qr" | "otp">("qr");

  // Dashboard specific state
  const [timeframe, setTimeframe] = useState<"today" | "7d" | "30d">("today");
  const [analyticsData, setAnalyticsData] = useState<LiveVendorAnalyticsData | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [isAnalyticsError, setIsAnalyticsError] = useState(false);
  const [menuItems, setMenuItems] = useState<VendorMenuItem[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);

  const ordersBoardRef = useRef<HTMLDivElement>(null);

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

  const applyOrders = useCallback((liveOrders: VendorOrder[]) => {
    setOrders(liveOrders);

    const currentPlacedIds = liveOrders
      .filter((o) => o.status === "placed")
      .map((o) => o.id);

    if (!hasLoadedOnceRef.current) {
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
      document.title = TAB_TITLE_ALERT;
    }
  }, []);

  const loadMenuAndCategories = useCallback(async (cId?: string | null) => {
    setIsMenuLoading(true);
    const [liveItems, cats] = await Promise.all([
      getLiveVendorMenuItems(cId ?? null),
      getLiveVendorCategories(),
    ]);
    setMenuItems(liveItems);
    setCategories(cats.map((c) => c.name));
    setIsMenuLoading(false);

    if (cId && liveItems.length > 0) {
      cacheVendorMenuLocally(
        cId,
        liveItems.map((i) => ({
          id: i.id,
          canteenId: cId,
          name: i.name,
          price: i.price,
          category: i.category || "General",
          available: i.inStock,
        }))
      );
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!canteenId) {
      setIsLoading(false);
      return;
    }
    const liveOrders = await getLiveVendorOrders(canteenId);
    applyOrders(liveOrders);
    setIsLoading(false);
  }, [canteenId, applyOrders]);

  const fetchAnalytics = useCallback(async (tf: "today" | "7d" | "30d" = "today") => {
    setIsAnalyticsLoading(true);
    setIsAnalyticsError(false);
    const res = await getLiveVendorAnalytics(tf);
    if (res.ok && res.data) {
      setAnalyticsData(res.data);
    } else {
      setIsAnalyticsError(true);
    }
    setIsAnalyticsLoading(false);
  }, []);

  // Primary data loader: runs in parallel once canteenId is resolved
  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    let cleanupSync: (() => void) | null = null;

    if (!canteenId) {
      setIsLoading(false);
      setIsAnalyticsLoading(false);
      return;
    }

    cleanupSync = initAutomaticManualOrderSync(canteenId);

    // Parallel fetch of critical live orders and analytics
    Promise.all([
      getLiveVendorOrders(canteenId),
      getLiveVendorAnalytics("today"),
    ]).then(([liveOrders, analyticsRes]) => {
      if (!isMounted) return;
      applyOrders(liveOrders);
      setIsLoading(false);

      if (analyticsRes.ok && analyticsRes.data) {
        setAnalyticsData(analyticsRes.data);
      } else {
        setIsAnalyticsError(true);
      }
      setIsAnalyticsLoading(false);
    });

    // Secondary load: menu and categories
    loadMenuAndCategories(canteenId);

    const supabase = createClient();
    channel = supabase
      .channel(`vendor-dashboard-realtime-${canteenId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `canteen_id=eq.${canteenId}` },
        () => {
          fetchOrders();
          fetchAnalytics(timeframe);
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
      if (cleanupSync) cleanupSync();
      sound.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canteenId]);

  const pendingPlacedOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status === "placed" &&
          !o.isManual &&
          o.orderType !== "MANUAL_CASH_ORDER" &&
          !o.orderNumber.includes("-M-")
      ),
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
    setTimeout(() => hardNavigate("/vendor/auth?next=%2Fvendor"), 2500);
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
      fetchAnalytics(timeframe);
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
      fetchAnalytics(timeframe);
    } catch {
      const msg = "Network error cancelling order.";
      setActionError(msg);
      showNotification(msg);
    }
  };

  const handleToggleStock = async (itemId: string, inStock: boolean) => {
    const res = await toggleLiveVendorMenuItemStock(itemId, inStock);
    if (res.ok) {
      showNotification(`Item marked ${inStock ? "IN STOCK" : "OUT OF STOCK"}`);
      if (canteenId) {
        loadMenuAndCategories(canteenId);
      }
    } else {
      showNotification(res.error ?? "Failed to update item availability.");
    }
  };

  const handleSaveItem = async (
    itemData: Omit<VendorMenuItem, "id"> & { id?: string },
  ) => {
    const res = await addLiveVendorMenuItem(itemData);
    if (res.ok) {
      showNotification(`"${itemData.name}" added to menu successfully`);
      if (canteenId) {
        loadMenuAndCategories(canteenId);
      }
    } else {
      showNotification(res.error ?? "Failed to add dish.");
    }
  };

  const handleScrollToOrders = () => {
    ordersBoardRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "cancelled"),
    [orders],
  );

  const liveRevenue = useMemo(() => {
    const completedOrders = orders.filter(
      (o) => o.status === "completed" || o.status === "picked_up",
    );
    return completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
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

        {/* 1. KEY METRICS */}
        <VendorMetricCards
          ordersCount={analyticsData?.summary?.totalOrders ?? activeOrders.length}
          totalRevenue={analyticsData?.summary?.todaysSales ?? liveRevenue}
          avgPrepMinutes={store.prepTimeMinutes}
          isLoading={isLoading}
        />

        {/* 2. QUICK ACTIONS */}
        <VendorQuickActions
          onAddNewItem={() => setIsAddModalOpen(true)}
          onOpenScanner={(mode) => {
            setScannerInitialMode(mode);
            setIsScannerOpen(true);
          }}
          onScrollToOrders={handleScrollToOrders}
          onOpenManualOrder={() => setIsManualOrderOpen(true)}
        />

        {/* 3. LIVE ORDER OVERVIEW */}
        <VendorLiveOrderOverview
          orders={orders}
          onAdvanceStatus={handleAdvanceOrderStatus}
          onCancelOrder={handleCancelOrder}
          onViewAllOrders={handleScrollToOrders}
        />

        {/* 4. SALES OVERVIEW & TOP SELLING ITEMS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <VendorSalesChart
              hourlyVolume={analyticsData?.hourlyVolume ?? []}
              totalRevenue={analyticsData?.summary?.todaysSales ?? liveRevenue}
              totalOrders={analyticsData?.summary?.totalOrders ?? activeOrders.length}
              timeframe={timeframe}
              onTimeframeChange={(tf) => {
                setTimeframe(tf);
                fetchAnalytics(tf);
              }}
              isLoading={isAnalyticsLoading}
              isError={isAnalyticsError}
              onRetry={() => fetchAnalytics(timeframe)}
            />
          </div>
          <div className="lg:col-span-1">
            <VendorTopSellingItems
              topItems={analyticsData?.topItems ?? []}
              isLoading={isAnalyticsLoading}
            />
          </div>
        </div>

        {/* 5. LOW STOCK ALERTS & RECENT ACTIVITY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VendorLowStockAlerts
            menuItems={menuItems}
            onToggleStock={handleToggleStock}
            isLoading={isMenuLoading}
          />
          <VendorRecentActivity
            orders={orders}
            isLoading={isLoading}
          />
        </div>

        {/* 6. LIVE ORDERS BOARD */}
        <div ref={ordersBoardRef} className="pt-2 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="font-display text-title font-bold text-foreground">
                Active Order Operations Board
              </h2>
              <p className="text-caption text-muted">
                Advance order tickets through live kitchen fulfillment stages
              </p>
            </div>
            <span className="rounded-full bg-primary/10 border border-primary/30 px-3 py-1 font-display text-caption font-bold text-primary">
              {activeOrders.length} Active Orders
            </span>
          </div>

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
              vendorName={store.name}
              onAdvanceStatus={handleAdvanceOrderStatus}
              onCancelOrder={handleCancelOrder}
            />
          )}
        </div>
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
          fetchAnalytics(timeframe);
        }}
      />

      <VendorNotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectOrder={() => {
          fetchOrders();
        }}
      />

      <VendorMenuItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveItem}
        editingItem={null}
        categories={categories}
      />

      <ManualCashOrderModal
        isOpen={isManualOrderOpen}
        onClose={() => setIsManualOrderOpen(false)}
        canteenId={canteenId || ""}
        menuItems={menuItems}
        onOrderCreated={(num) => {
          showNotification(num ? `Manual Cash Order ${num} created` : "Manual Cash Order saved locally (Pending Sync)");
          fetchOrders();
          fetchAnalytics(timeframe);
        }}
      />
    </div>
  );
}
