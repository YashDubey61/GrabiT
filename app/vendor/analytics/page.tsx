"use client";

import { useEffect, useState } from "react";
import {
  MOCK_ANALYTICS_SUMMARY,
  MOCK_HOURLY_VOLUME_POINTS,
  MOCK_TOP_ITEMS,
  MOCK_PAYOUT_RECORDS,
  type VendorAnalyticsSummary,
  type VendorHourlyPoint,
  type VendorTopItemMetric,
  type VendorPayoutRecord,
} from "@/lib/mock/vendor";
import { VendorAnalyticsQuickStats } from "@/components/vendor/analytics/VendorAnalyticsQuickStats";
import { VendorHourlyVolumeChart } from "@/components/vendor/analytics/VendorHourlyVolumeChart";
import { VendorTopItemsList } from "@/components/vendor/analytics/VendorTopItemsList";
import { VendorPayoutLedger } from "@/components/vendor/analytics/VendorPayoutLedger";
import { getLiveVendorAnalytics } from "@/lib/supabase/vendor_analytics";

export default function VendorAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<"today" | "7d" | "30d">("today");
  const [summary, setSummary] = useState<VendorAnalyticsSummary>(MOCK_ANALYTICS_SUMMARY);
  const [hourlyVolume, setHourlyVolume] = useState<VendorHourlyPoint[]>(MOCK_HOURLY_VOLUME_POINTS);
  const [topItems, setTopItems] = useState<VendorTopItemMetric[]>(MOCK_TOP_ITEMS);
  const [payouts, setPayouts] = useState<VendorPayoutRecord[]>(MOCK_PAYOUT_RECORDS);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadAnalytics = async (tf: "today" | "7d" | "30d") => {
    setIsLoading(true);
    const data = await getLiveVendorAnalytics(tf);
    if (data) {
      setSummary(data.summary);
      setHourlyVolume(data.hourlyVolume);
      setTopItems(data.topItems);
      setPayouts(data.payouts);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAnalytics(timeframe);
  }, [timeframe]);

  const handleDownloadCsv = () => {
    showNotification("Downloading full payout settlement CSV...");
    window.open("/api/vendor/analytics/payouts/export", "_blank");
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full flex flex-col gap-6 pb-24">
        {notification && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-body-sm font-semibold text-primary animate-fade-in">
            {notification}
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-title font-bold text-foreground sm:text-[28px]">
              Analytics &amp; Payouts
            </h2>
            <p className="text-body-sm text-faint">
              Track daily sales, order throughput, top dishes, and settlement payouts.
            </p>
          </div>

          {/* Timeframe Selector Chips */}
          <div className="mt-2 sm:mt-0 flex items-center gap-1 rounded-xl border border-border bg-[#1e1f26] p-1 w-fit">
            <button
              type="button"
              onClick={() => setTimeframe("today")}
              className={`rounded-lg px-3 py-1.5 font-display text-caption font-bold transition-all ${timeframe === "today"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-faint hover:text-foreground"
                }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setTimeframe("7d")}
              className={`rounded-lg px-3 py-1.5 font-display text-caption font-bold transition-all ${timeframe === "7d"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-faint hover:text-foreground"
                }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeframe("30d")}
              className={`rounded-lg px-3 py-1.5 font-display text-caption font-bold transition-all ${timeframe === "30d"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-faint hover:text-foreground"
                }`}
            >
              30 Days
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined text-[32px] text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-body-sm text-muted">Loading live analytics from Supabase...</p>
          </div>
        ) : (
          <>
            {/* Quick Stats Cards */}
            <VendorAnalyticsQuickStats summary={summary} />

            {/* Hourly Volume & Top Items Grid */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <VendorHourlyVolumeChart
                  data={hourlyVolume}
                  onTimeframeChange={(tf) => {
                    const mappedTf = tf === "7 Days" ? "7d" : tf === "30 Days" ? "30d" : "today";
                    setTimeframe(mappedTf);
                    showNotification(`Analytics filter set to ${tf}`);
                  }}
                />
              </div>

              <div>
                <VendorTopItemsList
                  items={topItems}
                  onViewAllClick={() =>
                    showNotification("Detailed dish metrics panel opened")
                  }
                />
              </div>
            </section>

            {/* Payout Ledger */}
            <VendorPayoutLedger
              records={payouts}
              onDownloadHistory={handleDownloadCsv}
            />
          </>
        )}
      </main>
    </div>
  );
}
