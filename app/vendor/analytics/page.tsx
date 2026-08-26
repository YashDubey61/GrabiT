"use client";

import { useEffect, useState, useCallback } from "react";
import { VendorHeader } from "@/components/vendor/orders/VendorHeader";
import { VendorMoreFeaturesSheet } from "@/components/vendor/orders/VendorMoreFeaturesSheet";
import { VendorMobileNavMenu } from "@/components/vendor/orders/VendorMobileNavMenu";
import { VendorProfileSheet } from "@/components/vendor/orders/VendorProfileSheet";
import { VENDOR_NAV } from "@/app/vendor/layout";
import { VendorNotificationsDrawer } from "@/components/vendor/notifications/VendorNotificationsDrawer";
import {
  getLiveVendorAnalytics,
  exportVendorAnalyticsCsv,
  type VendorAnalyticsData,
} from "@/lib/supabase/vendor_analytics";
import { useVendor } from "@/lib/vendor/VendorContext";
import { createClient } from "@/lib/supabase/client";
import { useOrderAlertSound } from "@/lib/vendor/useOrderAlertSound";

import { VendorAnalyticsOverviewCards } from "@/components/vendor/analytics/VendorAnalyticsOverviewCards";
import { VendorAnalyticsRevenueChart } from "@/components/vendor/analytics/VendorAnalyticsRevenueChart";
import { VendorAnalyticsOrdersBreakdown } from "@/components/vendor/analytics/VendorAnalyticsOrdersBreakdown";
import { VendorAnalyticsTopProducts } from "@/components/vendor/analytics/VendorAnalyticsTopProducts";
import { VendorAnalyticsCategoryChart } from "@/components/vendor/analytics/VendorAnalyticsCategoryChart";
import { VendorAnalyticsPeakHours } from "@/components/vendor/analytics/VendorAnalyticsPeakHours";
import { VendorAnalyticsCustomerOfferInsights } from "@/components/vendor/analytics/VendorAnalyticsCustomerOfferInsights";
import { VendorAnalyticsInventoryInsights } from "@/components/vendor/analytics/VendorAnalyticsInventoryInsights";

export default function VendorAnalyticsPage() {
  const { store, canteenId } = useVendor();
  const sound = useOrderAlertSound();
  const [timeframe, setTimeframe] = useState("7d");
  const [customStart] = useState("");
  const [customEnd] = useState("");

  const [data, setData] = useState<VendorAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Modals & Drawers
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMoreFeaturesOpen, setIsMoreFeaturesOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const loadAnalytics = useCallback(
    async (tf = timeframe, start = customStart, end = customEnd) => {
      setIsError(false);
      const res = await getLiveVendorAnalytics(tf, start, end);
      if (res.ok && res.data) {
        setData(res.data);
      } else {
        setIsError(true);
      }
      setIsLoading(false);
    },
    [timeframe, customStart, customEnd],
  );

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;

    if (!canteenId) return;

    loadAnalytics();

    const supabase = createClient();
    channel = supabase
      .channel(`vendor-analytics-realtime-${canteenId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `canteen_id=eq.${canteenId}` },
        () => {
          loadAnalytics();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [canteenId, loadAnalytics]);

  const handleTimeframeChange = useCallback((newTf: string) => {
    setTimeframe(newTf);
    setIsLoading(true);
    loadAnalytics(newTf);
  }, [loadAnalytics]);

  const handleExportCsv = useCallback(() => {
    if (!data) return;
    exportVendorAnalyticsCsv(data);
    showNotification("Analytics CSV report generated and downloaded.");
  }, [data, showNotification]);

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <VendorHeader
        store={store}
        onToggleStatus={() => {}}
        onChangePrepTime={() => {}}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenMoreFeatures={() => setIsMoreFeaturesOpen(true)}
        onOpenNavMenu={() => setIsNavMenuOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
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
        onToggleStatus={() => {}}
        onChangePrepTime={() => {}}
        isSoundUnlocked={sound.isUnlocked}
        onUnlockSound={sound.unlock}
      />

      <VendorProfileSheet
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        store={store}
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-24 sm:pb-8 flex flex-col gap-6">
        {notification && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-body-sm font-semibold text-primary animate-fade-in">
            {notification}
          </div>
        )}

        {/* Title & Top Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-display text-title font-extrabold text-foreground sm:text-display">
              Vendor Analytics & Insights
            </h1>
            <p className="text-caption text-muted">
              Real-time sales, order volume, product demand & peak hour intelligence
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe Pills */}
            <div className="flex rounded-xl bg-surface-elevated p-1 border border-border">
              {[
                { label: "Today", value: "today" },
                { label: "Yesterday", value: "yesterday" },
                { label: "7 Days", value: "7d" },
                { label: "30 Days", value: "30d" },
                { label: "This Month", value: "this_month" },
              ].map((tf) => (
                <button
                  key={tf.value}
                  type="button"
                  onClick={() => handleTimeframeChange(tf.value)}
                  className={`rounded-lg px-3 py-1.5 font-display text-caption font-bold transition-all ${
                    timeframe === tf.value
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!data}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-elevated px-4 py-2.5 font-display text-body-sm font-bold text-muted hover:border-primary/40 hover:text-foreground active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export Report
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="material-symbols-outlined text-[36px] text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-body-sm text-muted">Aggregating live vendor analytics from Supabase...</p>
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-12 text-center">
            <span className="material-symbols-outlined text-[40px] text-danger">error</span>
            <h3 className="font-display text-title font-bold text-foreground">
              Unable to load analytics
            </h3>
            <p className="text-caption text-muted">
              Check your network connection and try again.
            </p>
            <button
              type="button"
              onClick={() => loadAnalytics()}
              className="mt-2 rounded-xl bg-primary px-5 py-2.5 font-display text-caption font-bold text-on-primary"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Top-Level Metrics */}
            <VendorAnalyticsOverviewCards metrics={data.metrics} />

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <VendorAnalyticsRevenueChart trendData={data.revenueTrend} />
              </div>
              <div>
                <VendorAnalyticsOrdersBreakdown
                  breakdown={data.orderStatusBreakdown}
                  totalOrders={data.metrics.totalOrders}
                  avgPrepTimeMinutes={data.metrics.avgPrepTimeMinutes}
                />
              </div>
            </div>

            {/* Top Products & Category Distribution */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <VendorAnalyticsTopProducts
                  topProducts={data.topProducts}
                  bestPerformers={data.bestPerformers}
                  slowMovers={data.slowMovers}
                />
              </div>
              <div>
                <VendorAnalyticsCategoryChart categories={data.categoryAnalytics} />
              </div>
            </div>

            {/* Peak Ordering Hours */}
            <VendorAnalyticsPeakHours
              peakHours={data.peakHours}
              summary={data.peakHourSummary}
            />

            {/* Customer & Offer Insights */}
            <VendorAnalyticsCustomerOfferInsights
              customerInsights={data.customerInsights}
              offerPerformance={data.offerPerformance}
            />

            {/* Inventory Insights */}
            <VendorAnalyticsInventoryInsights
              inventoryInsights={data.inventoryInsights}
            />
          </>
        )}
      </main>

      <VendorNotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectOrder={() => {}}
      />
    </div>
  );
}
