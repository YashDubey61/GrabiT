"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExecutiveOverviewCards } from "@/components/superadmin/intelligence/ExecutiveOverviewCards";
import { PlatformHealthScoreBanner } from "@/components/superadmin/intelligence/PlatformHealthScoreBanner";
import { PlatformGrowthCharts } from "@/components/superadmin/intelligence/PlatformGrowthCharts";
import { CampusVendorIntelligenceTables } from "@/components/superadmin/intelligence/CampusVendorIntelligenceTables";
import { DemandAndProductIntelligence } from "@/components/superadmin/intelligence/DemandAndProductIntelligence";
import { ActionableInsightsPanel } from "@/components/superadmin/intelligence/ActionableInsightsPanel";
import type {
  ExecutiveOverviewStats,
  PlatformHealthScoreData,
  GrowthPoint,
  CampusIntelligenceItem,
  VendorIntelligenceItem,
  ProductIntelligenceItem,
  DemandForecastData,
  ActionableInsightItem,
} from "@/lib/supabase/superadmin_intelligence";

export default function SuperAdminIntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState("30d");

  const [stats, setStats] = useState<ExecutiveOverviewStats>({
    gmv: 0,
    platformRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    activeStudents: 0,
    activeVendors: 0,
    completionRate: 0,
    repeatOrderRate: 0,
    avgRating: 0,
    vendorAvailabilityRate: 0,
    comparisons: { gmvGrowthPct: 0, revenueGrowthPct: 0, orderGrowthPct: 0, studentGrowthPct: 0 },
  });

  const [healthScore, setHealthScore] = useState<PlatformHealthScoreData>({
    overallScore: 92,
    pillars: {
      operations: { score: 95, label: "Operations Health", metric: "98.4% Order Completion" },
      payments: { score: 97, label: "Payments & Financial", metric: "99.1% Payment Success" },
      customerExperience: { score: 89, label: "Customer Experience", metric: "4.7 / 5.0 Rating" },
      vendorHealth: { score: 91, label: "Vendor Health", metric: "94.5% Availability" },
      security: { score: 94, label: "Security Posture", metric: "Zero Critical Violations" },
    },
  });

  const [growth, setGrowth] = useState<{
    points: GrowthPoint[];
    peakGmvDay: string;
    peakOrderDay: string;
  }>({
    points: [],
    peakGmvDay: "N/A",
    peakOrderDay: "N/A",
  });

  const [campuses, setCampuses] = useState<CampusIntelligenceItem[]>([]);
  const [vendors, setVendors] = useState<VendorIntelligenceItem[]>([]);
  const [products, setProducts] = useState<ProductIntelligenceItem[]>([]);
  const [demand, setDemand] = useState<DemandForecastData>({
    status: "AVAILABLE",
    peakHours: [],
    peakDays: [],
    forecastedOrdersNextDay: 0,
    forecastedOrdersNext7Days: 0,
    confidencePct: 90,
    trendDirection: "UPWARD",
  });
  const [insights, setInsights] = useState<ActionableInsightItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      params.set("timeframe", timeframe);

      const res = await fetch(`/api/superadmin/intelligence?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setStats(data.stats);
        setHealthScore(data.healthScore);
        setGrowth(data.growth);
        setCampuses(data.campuses);
        setVendors(data.vendors);
        setProducts(data.products);
        setDemand(data.demand);
        setInsights(data.insights);
      } else {
        setErrorMsg(data.error || "Failed to load platform intelligence telemetry.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error loading intelligence data.");
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Supabase Realtime channel listener
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("superadmin_intelligence_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const res = await fetch(`/api/superadmin/intelligence/export?timeframe=${timeframe}`);
      if (!res.ok) throw new Error("CSV Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grabit_platform_intelligence_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err?.message || "Failed to export platform intelligence report.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Platform Intelligence & Advanced Analytics</h1>
            <span className="bg-purple-950/60 border border-purple-800/60 text-purple-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              Live Executive Telemetry
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Actionable insights, growth trajectories, campus rankings, demand heatmaps, and 5-pillar platform health index
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold text-orange-400 focus:outline-none focus:border-orange-500"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="this_month">This Month</option>
            <option value="prev_month">Previous Month</option>
          </select>

          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            {exporting ? (
              <span className="material-icons animate-spin text-xs">sync</span>
            ) : (
              <span className="material-icons text-xs">download</span>
            )}
            CSV Export
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons text-base text-rose-400">error</span>
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => loadData()}
            className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded font-semibold text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* 5 Pillar Platform Health Index Banner */}
      <PlatformHealthScoreBanner healthScore={healthScore} />

      {/* Executive Overview KPI Cards */}
      <ExecutiveOverviewCards stats={stats} loading={loading && campuses.length === 0} />

      {/* Platform Growth Charts */}
      <PlatformGrowthCharts growth={growth} />

      {/* Campus & Vendor Performance Rankings */}
      <CampusVendorIntelligenceTables campuses={campuses} vendors={vendors} />

      {/* Demand Analytics & Product Velocity */}
      <DemandAndProductIntelligence demand={demand} products={products} />

      {/* Actionable Executive Insights Panel */}
      <ActionableInsightsPanel insights={insights} />
    </div>
  );
}
