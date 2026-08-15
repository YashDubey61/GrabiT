"use client";

import { useEffect, useState } from "react";
import type {
  ProductAnalyticsData,
  AnalyticsTimeframe,
} from "@/lib/supabase/product_analytics";
import type {
  RetentionAnalyticsData,
} from "@/lib/supabase/retention_analytics";
import type {
  BusinessAnalyticsData,
} from "@/lib/supabase/business_analytics";
import type {
  BusinessInsightsData,
} from "@/lib/supabase/business_insights";

export default function SuperAdminAnalyticsPage() {
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>("30d");
  const [data, setData] = useState<ProductAnalyticsData | null>(null);
  const [retentionData, setRetentionData] = useState<RetentionAnalyticsData | null>(null);
  const [businessData, setBusinessData] = useState<BusinessAnalyticsData | null>(null);
  const [insightsData, setInsightsData] = useState<BusinessInsightsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("Updating...");

  useEffect(() => {
    let isSubscribed = true;

    async function loadAnalytics() {
      try {
        const [resProd, resRet, resBiz, resIns] = await Promise.all([
          fetch(`/api/superadmin/analytics?timeframe=${timeframe}`),
          fetch(`/api/superadmin/retention?timeframe=${timeframe}`),
          fetch(`/api/superadmin/business-analytics?timeframe=${timeframe}`),
          fetch(`/api/superadmin/insights?timeframe=${timeframe}`),
        ]);

        if (!resProd.ok || !resRet.ok || !resBiz.ok || !resIns.ok) {
          if (
            resProd.status === 401 ||
            resProd.status === 403 ||
            resRet.status === 401 ||
            resRet.status === 403 ||
            resBiz.status === 401 ||
            resBiz.status === 403 ||
            resIns.status === 401 ||
            resIns.status === 403
          ) {
            throw new Error("Unauthorized: Super Admin credentials required.");
          }
          throw new Error("Failed to load analytics data.");
        }

        const [jsonProd, jsonRet, jsonBiz, jsonIns]: [
          ProductAnalyticsData,
          RetentionAnalyticsData,
          BusinessAnalyticsData,
          BusinessInsightsData,
        ] = await Promise.all([resProd.json(), resRet.json(), resBiz.json(), resIns.json()]);

        if (isSubscribed) {
          setData(jsonProd);
          setRetentionData(jsonRet);
          setBusinessData(jsonBiz);
          setInsightsData(jsonIns);
          setError(null);
          setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour12: false }));
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          setError(err instanceof Error ? err.message : "An error occurred");
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      isSubscribed = false;
    };
  }, [timeframe]);

  const handleTimeframeChange = (tf: AnalyticsTimeframe) => {
    setTimeframe(tf);
    setLoading(true);
  };

  const handleForceRefresh = async () => {
    setRefreshing(true);
    try {
      const [resProd, resRet, resBiz, resIns] = await Promise.all([
        fetch(`/api/superadmin/analytics?timeframe=${timeframe}`),
        fetch(`/api/superadmin/retention?timeframe=${timeframe}`),
        fetch(`/api/superadmin/business-analytics?timeframe=${timeframe}`),
        fetch(`/api/superadmin/insights?timeframe=${timeframe}`),
      ]);
      if (!resProd.ok || !resRet.ok || !resBiz.ok || !resIns.ok) {
        throw new Error("Failed to refresh analytics.");
      }
      const [jsonProd, jsonRet, jsonBiz, jsonIns]: [
        ProductAnalyticsData,
        RetentionAnalyticsData,
        BusinessAnalyticsData,
        BusinessInsightsData,
      ] = await Promise.all([resProd.json(), resRet.json(), resBiz.json(), resIns.json()]);
      setData(jsonProd);
      setRetentionData(jsonRet);
      setBusinessData(jsonBiz);
      setInsightsData(jsonIns);
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour12: false }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !data) {
    return (
      <main className="min-h-screen bg-background text-foreground p-6 flex flex-col items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-[#FF6D00] text-3xl">
            progress_activity
          </span>
          <p className="text-gray-400 font-medium">Loading Business Intelligence & Decision Support...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-8">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#262626] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#FF6D00] uppercase mb-1">
            <span className="material-symbols-outlined text-sm">analytics</span>
            Super Admin Decision Support
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Business Intelligence & Decision Support
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Deterministic Business Health Score, short-term GMV/Order forecasts, opportunity engines, and prioritized action center.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe Filter Tabs */}
          <div className="flex items-center bg-[#1E1F26] p-1 rounded-xl border border-[#262626]">
            {(["today", "7d", "30d", "90d"] as AnalyticsTimeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeframe === tf
                    ? "bg-[#FF6D00] text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tf === "today" ? "Today" : tf === "7d" ? "7 Days" : tf === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>

          {/* Force Refresh Button */}
          <button
            onClick={handleForceRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E1F26] border border-[#262626] text-xs font-semibold text-gray-300 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${refreshing ? "animate-spin" : ""}`}>
              refresh
            </span>
            Force Refresh
          </button>
        </div>
      </div>

      {/* Error Toast / Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-400">error</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Freshness Timestamp & Event Tracking Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Production Data Sync</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800/40 text-[11px] font-medium">
            ⚡ Deterministic Business Intelligence Engine Active
          </span>
        </div>
        <div>
          Updated <span className="text-white font-mono">{lastUpdated}</span>
        </div>
      </div>

      {/* 2. Business Intelligence & Decision Support Section (DAY 43) */}
      {insightsData && (
        <div className="space-y-6">
          {/* Health Score & Executive Summary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Business Health Score Card */}
            <div className="p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Business Health Score</h2>
                  <div className="text-4xl font-extrabold text-[#FF6D00] mt-1 flex items-baseline gap-2">
                    {insightsData.healthScore.score}
                    <span className="text-sm font-semibold text-gray-400">/ 100</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-xs font-bold font-mono">
                  {insightsData.healthScore.grade}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-3">
                <div className="flex justify-between py-0.5">
                  <span className="text-gray-400">Revenue</span>
                  <span className="font-mono text-white font-semibold">{insightsData.healthScore.categoryScores.revenue}/100</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-gray-400">Growth</span>
                  <span className="font-mono text-white font-semibold">{insightsData.healthScore.categoryScores.growth}/100</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-gray-400">Retention</span>
                  <span className="font-mono text-white font-semibold">{insightsData.healthScore.categoryScores.retention}/100</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-gray-400">Payments</span>
                  <span className="font-mono text-white font-semibold">{insightsData.healthScore.categoryScores.payments}/100</span>
                </div>
              </div>

              <div className="text-[10px] text-gray-500 leading-tight border-t border-white/5 pt-2">
                {insightsData.healthScore.methodologyNote}
              </div>
            </div>

            {/* Executive Summary Card */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-[#FF6D00]">insights</span>
                  Executive Summary Highlights
                </h3>
                <span className="text-xs font-mono text-gray-400">Top Highlights</span>
              </div>

              <ul className="space-y-2.5 pt-1 text-xs">
                {insightsData.executiveSummary.map((item, i) => (
                  <li key={i} className="p-3 rounded-xl bg-black/40 border border-[#262626] flex items-start gap-2.5 text-gray-200">
                    <span className="material-symbols-outlined text-emerald-400 text-base shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Growth Outlook & Forecasting Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* GMV Forecast Card */}
            <div className="p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">trending_up</span>
                  Short-Term GMV Forecast
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800/40">
                  {insightsData.gmvForecast.confidence} Confidence
                </span>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Next 7 Days GMV</span>
                  <span className="font-mono text-white font-bold">₹{insightsData.gmvForecast.next7DaysGmv.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Next 30 Days GMV</span>
                  <span className="font-mono text-[#FF6D00] font-bold">₹{insightsData.gmvForecast.next30DaysGmv.toLocaleString("en-IN")}</span>
                </div>
                <div className="text-[10px] text-gray-500 leading-tight pt-1">
                  {insightsData.gmvForecast.methodology}
                </div>
              </div>
            </div>

            {/* Order Volume Forecast Card */}
            <div className="p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">shopping_cart</span>
                  Order Volume Forecast
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950/60 text-sky-400 border border-sky-800/40">
                  {insightsData.orderForecast.confidence} Confidence
                </span>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Next 7 Days Orders</span>
                  <span className="font-mono text-white font-bold">{insightsData.orderForecast.next7DaysOrders} orders</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Next 30 Days Orders</span>
                  <span className="font-mono text-sky-300 font-bold">{insightsData.orderForecast.next30DaysOrders} orders</span>
                </div>
                <div className="text-[10px] text-gray-500 leading-tight pt-1">
                  {insightsData.orderForecast.methodology}
                </div>
              </div>
            </div>

            {/* Active Student Trend Card */}
            <div className="p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">show_chart</span>
                  Active Student Trend
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-bold">
                  {insightsData.studentTrend.trendDirection}
                </span>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Projected Active MAU</span>
                  <span className="font-mono text-white font-bold">{insightsData.studentTrend.projectedActiveStudents} students</span>
                </div>
                <div className="text-[10px] text-gray-500 leading-tight pt-1">
                  {insightsData.studentTrend.methodology}
                </div>
              </div>
            </div>
          </div>

          {/* Action Center Card (Ranked Priorities 1 to 5) */}
          <div className="p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF6D00]">task_alt</span>
                Action Center & Decision Support
              </h3>
              <span className="text-xs font-mono text-gray-400">Ranked by Priority</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insightsData.actionCenter.map((act) => (
                <div key={act.priority} className="p-4 rounded-xl bg-black/40 border border-[#262626] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6D00]/20 text-[#FF6D00] border border-[#FF6D00]/40 font-mono">
                      PRIORITY {act.priority}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">{act.expectedImpact}</span>
                  </div>

                  <h4 className="text-xs font-bold text-white">{act.title}</h4>

                  <div className="space-y-1 text-[11px] text-gray-300">
                    <p><strong className="text-gray-400">WHY:</strong> {act.why}</p>
                    <p><strong className="text-gray-400">EVIDENCE:</strong> {act.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Revenue & Unit Economics Section (DAY 42) */}
      {businessData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF6D00]">payments</span>
                Revenue & Growth Economics
              </h2>
              <p className="text-xs text-gray-400">GMV breakdown, platform revenue, period-over-period growth %, and unit economics.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#FF6D00]/10 text-[#FF6D00] border border-[#FF6D00]/30 text-xs font-mono">
              Net Revenue: ₹{businessData.revenue.netRevenue.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Revenue KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total GMV */}
            <div className="p-4 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
              <div className="text-xs font-medium text-gray-400">Total GMV</div>
              <div className="text-2xl font-bold text-[#FF6D00]">
                ₹{businessData.revenue.totalGmv.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-emerald-400">
                {businessData.growth.gmvGrowthPercent >= 0 ? "+" : ""}{businessData.growth.gmvGrowthPercent}% vs prior period
              </div>
            </div>

            {/* Food GMV */}
            <div className="p-4 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
              <div className="text-xs font-medium text-gray-400">Food GMV</div>
              <div className="text-2xl font-bold text-white">
                ₹{businessData.revenue.foodGmv.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-gray-400">Excluding cancelled orders</div>
            </div>

            {/* Gold Subscription Revenue */}
            <div className="p-4 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
              <div className="text-xs font-medium text-gray-400">Gold Subscription Revenue</div>
              <div className="text-2xl font-bold text-amber-400">
                ₹{businessData.revenue.goldGmv.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-amber-300">
                {businessData.gold.goldShareOfTotalGmvPercent}% of Total GMV
              </div>
            </div>

            {/* Platform Revenue (Commission + Gold) */}
            <div className="p-4 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
              <div className="text-xs font-medium text-gray-400">Platform Commission</div>
              <div className="text-2xl font-bold text-emerald-400">
                ₹{businessData.revenue.platformCommission.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-emerald-400">
                {businessData.growth.revenueGrowthPercent >= 0 ? "+" : ""}{businessData.growth.revenueGrowthPercent}% revenue growth
              </div>
            </div>
          </div>

          {/* Unit Economics & Concentration Risk Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Unit Economics */}
            <div className="p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-3">
              <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">monitoring</span>
                Operational Unit Economics
              </h3>
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Revenue / Active Student</span>
                  <span className="font-mono text-white font-bold">₹{businessData.unitEconomics.revenuePerActiveStudent}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">GMV / Active Student</span>
                  <span className="font-mono text-gray-300">₹{businessData.unitEconomics.gmvPerActiveStudent}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Orders / Active Student</span>
                  <span className="font-mono text-gray-300">{businessData.unitEconomics.ordersPerActiveStudent} orders</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Platform Revenue / Order</span>
                  <span className="font-mono text-emerald-400 font-bold">₹{businessData.unitEconomics.platformRevenuePerOrder}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">LTV Status</span>
                  <span className="font-mono text-amber-400 font-semibold">{businessData.unitEconomics.ltvStatusNote}</span>
                </div>
              </div>
            </div>

            {/* Revenue Concentration Risk */}
            <div className="p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-3">
              <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">warning</span>
                Revenue Concentration Risk
              </h3>
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Top 5 Campus GMV Share</span>
                  <span className="font-mono text-white font-bold">{businessData.concentration.top5CampusGmvSharePercent}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Top 5 Vendor GMV Share</span>
                  <span className="font-mono text-[#FF6D00] font-bold">{businessData.concentration.top5VendorGmvSharePercent}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Top 10 Menu Item GMV Share</span>
                  <span className="font-mono text-gray-300">{businessData.concentration.top10MenuItemGmvSharePercent}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Risk Assessment</span>
                  <span className="font-mono text-emerald-400 font-semibold">{businessData.concentration.riskStatus}</span>
                </div>
              </div>
            </div>

            {/* Vendor Payout Exposure */}
            <div className="p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-3">
              <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">storefront</span>
                Vendor Settlement Exposure
              </h3>
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Vendor Payout Exposure</span>
                  <span className="font-mono text-sky-300 font-bold">₹{businessData.revenue.vendorPayoutValue.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Avg Vendor Payout / Order</span>
                  <span className="font-mono text-gray-300">₹{businessData.unitEconomics.vendorPayoutPerOrder}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Wallet Payment Share</span>
                  <span className="font-mono text-emerald-400 font-bold">{businessData.payments.walletPaymentSharePercent}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Razorpay Payment Share</span>
                  <span className="font-mono text-sky-400 font-bold">{businessData.payments.razorpayPaymentSharePercent}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Student Retention & Active Users Section (DAY 41) */}
      {retentionData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF6D00]">group</span>
                Student Retention & Active Users
              </h2>
              <p className="text-xs text-gray-400">DAU/WAU/MAU engagement metrics, repeat ordering rates, and time-to-second-order.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-xs font-mono">
              DAU/MAU Ratio: {retentionData.activeUsers.dauMauRatioPercent}%
            </span>
          </div>

          {/* Active Users KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* DAU */}
            <div className="p-4 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
              <div className="text-xs font-medium text-gray-400">DAU (Daily Active Users)</div>
              <div className="text-2xl font-bold text-white">
                {retentionData.activeUsers.dau}
              </div>
              <div className="text-[11px] text-gray-400">Unique active students today</div>
            </div>

            {/* WAU */}
            <div className="p-4 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
              <div className="text-xs font-medium text-gray-400">WAU (Weekly Active Users)</div>
              <div className="text-2xl font-bold text-white">
                {retentionData.activeUsers.wau}
              </div>
              <div className="text-[11px] text-gray-400">Unique active students last 7d</div>
            </div>

            {/* MAU */}
            <div className="p-4 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
              <div className="text-xs font-medium text-gray-400">MAU (Monthly Active Users)</div>
              <div className="text-2xl font-bold text-white">
                {retentionData.activeUsers.mau}
              </div>
              <div className="text-[11px] text-emerald-400">Unique active students last 30d</div>
            </div>

            {/* Repeat Order Rate */}
            <div className="p-4 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
              <div className="text-xs font-medium text-gray-400">Repeat Order Rate</div>
              <div className="text-2xl font-bold text-[#FF6D00]">
                {retentionData.growth.repeatOrderRatePercent}%
              </div>
              <div className="text-[11px] text-emerald-400">
                {retentionData.growth.repeatCustomersCount} repeat vs {retentionData.growth.oneTimeCustomersCount} one-time
              </div>
            </div>
          </div>

          {/* Time to 2nd Order & Growth Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Time to 2nd Order */}
            <div className="p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-3">
              <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">schedule</span>
                Time to Second Order
              </h3>
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Median Days to 2nd Order</span>
                  <span className="font-mono text-white font-bold">{retentionData.timeToSecondOrder.medianDays} days</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Average Days to 2nd Order</span>
                  <span className="font-mono text-gray-300">{retentionData.timeToSecondOrder.avgDays} days</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Reached 2nd Order</span>
                  <span className="font-mono text-emerald-400 font-bold">{retentionData.timeToSecondOrder.studentsReachedSecondOrder} students</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Awaiting 2nd Order</span>
                  <span className="font-mono text-amber-300">{retentionData.timeToSecondOrder.studentsAwaitingSecondOrder} students</span>
                </div>
              </div>
            </div>

            {/* Retention Cohorts Table */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">grid_view</span>
                  Weekly Order Retention Cohorts
                </h3>
                <span className="text-[11px] font-mono text-gray-400">Day 1 / 7 / 14 / 30 Retention</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-black/40 text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#262626]">
                    <tr>
                      <th className="py-2.5 px-3">Cohort</th>
                      <th className="py-2.5 px-3 text-right">Size</th>
                      <th className="py-2.5 px-3 text-right">Day 1</th>
                      <th className="py-2.5 px-3 text-right">Day 7</th>
                      <th className="py-2.5 px-3 text-right">Day 14</th>
                      <th className="py-2.5 px-3 text-right">Day 30</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626]">
                    {retentionData.cohorts.map((c) => (
                      <tr key={c.cohortLabel} className="hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-white">{c.cohortLabel}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-300">{c.cohortSize}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                          {c.day1Percent !== null ? `${c.day1Percent}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                          {c.day7Percent !== null ? `${c.day7Percent}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                          {c.day14Percent !== null ? `${c.day14Percent}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                          {c.day30Percent !== null ? `${c.day30Percent}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* User Lifecycle Segmentation */}
          <div className="p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">pie_chart</span>
              User Lifecycle Segments
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {retentionData.lifecycle.map((seg) => (
                <div key={seg.segment} className="p-3.5 rounded-xl border border-[#262626] bg-black/40 space-y-1">
                  <div className="text-xs font-semibold text-white">{seg.label}</div>
                  <div className="text-xl font-bold text-[#FF6D00]">{seg.count}</div>
                  <div className="text-[10px] text-gray-400">{seg.percentage}% of total</div>
                  <div className="text-[10px] text-gray-500 leading-tight pt-1 border-t border-white/5">
                    {seg.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. KPI Summary Cards Grid */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Active Students */}
          <div className="p-4 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
            <div className="text-xs font-medium text-gray-400">Active Students</div>
            <div className="text-2xl font-bold text-white">
              {data.users.activeStudents.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-400">
              +{data.users.newStudents} new registered
            </div>
          </div>

          {/* Total Orders */}
          <div className="p-4 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
            <div className="text-xs font-medium text-gray-400">Total Orders</div>
            <div className="text-2xl font-bold text-white">
              {data.orders.totalOrders.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-400">
              {data.orders.completedOrders} completed ({Math.round((data.orders.completedOrders / Math.max(1, data.orders.totalOrders)) * 100)}%)
            </div>
          </div>

          {/* Gross Merchandise Value */}
          <div className="p-4 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
            <div className="text-xs font-medium text-gray-400">Gross GMV</div>
            <div className="text-2xl font-bold text-[#FF6D00]">
              ₹{data.orders.gmv.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-gray-400">
              Commission: ₹{data.orders.platformCommission.toLocaleString("en-IN")}
            </div>
          </div>

          {/* Average Order Value */}
          <div className="p-4 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
            <div className="text-xs font-medium text-gray-400">Avg Order Value (AOV)</div>
            <div className="text-2xl font-bold text-white">
              ₹{data.orders.averageOrderValue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-gray-400">
              Per successful transaction
            </div>
          </div>

          {/* GrabIt Gold Subscribers */}
          <div className="p-4 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
            <div className="text-xs font-medium text-gray-400">Gold Subscribers</div>
            <div className="text-2xl font-bold text-amber-400">
              {data.gold.activeSubscribers}
            </div>
            <div className="text-[11px] text-amber-300">
              {data.gold.adoptionRatePercent}% student adoption
            </div>
          </div>

          {/* Repeat Customer Rate */}
          <div className="p-4 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
            <div className="text-xs font-medium text-gray-400">Repeat Customer Rate</div>
            <div className="text-2xl font-bold text-white">
              {data.users.repeatCustomerRatePercent}%
            </div>
            <div className="text-[11px] text-emerald-400">
              {data.retention.repeatOrderingStudentsCount} repeat orderers
            </div>
          </div>
        </div>
      )}

      {/* 6. Real Event-Driven Conversion Funnel Section */}
      {data && (
        <div className="p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-white">First-Party Conversion Funnel</h2>
              <p className="text-xs text-gray-400">Real-time student progression from home view to order completion.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[11px] font-mono">
              {data.eventTracking.totalEvents} Events Recorded
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
            {data.funnel.map((stage, idx) => (
              <div
                key={stage.stage}
                className="p-3.5 rounded-xl border border-[#262626] bg-black/40 flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-500">STAGE 0{idx + 1}</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    {stage.statusText}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-300 leading-tight">{stage.label}</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {stage.count.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="text-[10px] text-emerald-400 font-mono">
                  {stage.conversionPercent}% step conv
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation Performance Section (DAY 45) */}
      {data?.recommendations && (
        <div className="p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                Recommendation Performance & Conversion CTR
              </h2>
              <p className="text-xs text-gray-400">Aggregate recommendation impressions, clicks, CTR %, and order conversions.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[11px] font-mono">
              CTR: {data.recommendations.ctrPercent}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-black/40 border border-[#262626] space-y-1">
              <div className="text-xs font-medium text-gray-400">Recommendation Impressions</div>
              <div className="text-2xl font-bold text-white font-mono">{data.recommendations.impressionsCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-[#262626] space-y-1">
              <div className="text-xs font-medium text-gray-400">Recommendation Clicks</div>
              <div className="text-2xl font-bold text-[#FF6D00] font-mono">{data.recommendations.clicksCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-[#262626] space-y-1">
              <div className="text-xs font-medium text-gray-400">Add to Cart Conversion</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">{data.recommendations.addToCartCount}</div>
            </div>

          </div>
        </div>
      )}

      {/* Student Engagement & Notification Performance (DAY 47) */}
      {data?.notifications && (
        <div className="p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">notifications</span>
                Student Engagement &amp; Notification Performance
              </h2>
              <p className="text-xs text-gray-400">Aggregate notifications dispatched, read rates %, and category engagement.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[11px] font-mono">
              Read Rate: {data.notifications.readRatePercent}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-black/40 border border-[#262626] space-y-1">
              <div className="text-xs font-medium text-gray-400">Notifications Dispatched</div>
              <div className="text-2xl font-bold text-white font-mono">{data.notifications.sentCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-[#262626] space-y-1">
              <div className="text-xs font-medium text-gray-400">Notifications Viewed</div>
              <div className="text-2xl font-bold text-[#FF6D00] font-mono">{data.notifications.viewedCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-[#262626] space-y-1">
              <div className="text-xs font-medium text-gray-400">Notifications Marked Read</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">{data.notifications.readCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-[#262626] space-y-1">
              <div className="text-xs font-medium text-gray-400">Read Rate Percentage</div>
              <div className="text-2xl font-bold text-sky-400 font-mono">{data.notifications.readRatePercent}%</div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Ranked Campus Retention & Performance Table */}
      {data && (
        <div className="p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Campus Activity & Retention Ranking</h2>
              <p className="text-xs text-gray-400">Ranked campus volume, GMV, and 7d/30d retention rates.</p>
            </div>
            <div className="text-xs font-mono text-[#FF6D00]">
              {data.campuses.length} Active Campuses
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-black/40 text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#262626]">
                <tr>
                  <th className="py-3 px-4">Campus</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4 text-right">Orders</th>
                  <th className="py-3 px-4 text-right">Gross GMV</th>
                  <th className="py-3 px-4 text-right">AOV</th>
                  <th className="py-3 px-4 text-right">GMV Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {data.campuses.map((c, idx) => (
                  <tr key={c.campusId} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#FF6D00]/10 text-[#FF6D00] flex items-center justify-center text-[10px] font-mono">
                        {idx + 1}
                      </span>
                      {c.campusName}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">{c.city}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-white">
                      {c.orders}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#FF6D00]">
                      ₹{c.gmv.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-gray-300">
                      ₹{c.averageOrderValue}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-400">
                      {c.gmvSharePercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. Ranked Vendor & Menu Items Grid */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vendor Performance */}
          <div className="p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Vendor & Canteen Ranking</h2>
              <span className="text-xs text-gray-400 font-mono">{data.vendors.length} Vendors</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-black/40 text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#262626]">
                  <tr>
                    <th className="py-2.5 px-3">Canteen</th>
                    <th className="py-2.5 px-3 text-right">Orders</th>
                    <th className="py-2.5 px-3 text-right">GMV</th>
                    <th className="py-2.5 px-3 text-right">Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {data.vendors.map((v) => (
                    <tr key={v.canteenId} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{v.canteenName}</div>
                        <div className="text-[10px] text-gray-500">{v.campusName}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-white">{v.orders}</td>
                      <td className="py-3 px-3 text-right font-mono text-[#FF6D00]">₹{v.gmv.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400">{v.completionRatePercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Menu Items */}
          <div className="p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Top Selling Menu Items</h2>
              <span className="text-xs text-gray-400 font-mono">By Historical Revenue (order_items.price_at_order)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-black/40 text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#262626]">
                  <tr>
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Units</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {data.menuItems.map((mi) => (
                    <tr key={mi.menuItemId} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{mi.name}</div>
                        <div className="text-[10px] text-gray-500">{mi.canteenName}</div>
                      </td>
                      <td className="py-3 px-3 text-gray-400">{mi.category}</td>
                      <td className="py-3 px-3 text-right font-mono text-white">{mi.unitsSold}</td>
                      <td className="py-3 px-3 text-right font-mono text-[#FF6D00]">₹{mi.revenue.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
