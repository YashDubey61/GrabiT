"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { FinancialOverviewCards } from "@/components/superadmin/finance/FinancialOverviewCards";
import { FinancialFlowVisualizer } from "@/components/superadmin/finance/FinancialFlowVisualizer";
import { RevenueAnalyticsChart } from "@/components/superadmin/finance/RevenueAnalyticsChart";
import { VendorFinancialTable } from "@/components/superadmin/finance/VendorFinancialTable";
import { FinancialAnomaliesPanel } from "@/components/superadmin/finance/FinancialAnomaliesPanel";
import type {
  FinancialOverviewStats,
  FinancialFlowData,
  RevenueChartPoint,
  VendorFinancialItem,
  FinancialAnomalyItem,
  ReconciliationItem,
} from "@/lib/supabase/superadmin_finance";

export default function SuperAdminFinancePage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState("30d");

  const [stats, setStats] = useState<FinancialOverviewStats>({
    totalGmv: 0,
    netRevenue: 0,
    vendorEarnings: 0,
    grabitCommission: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalPayouts: 0,
    totalRefunds: 0,
    prevPeriodComparison: { gmvGrowthPct: 0, revenueGrowthPct: 0, orderGrowthPct: 0, payoutGrowthPct: 0 },
  });

  const [flow, setFlow] = useState<FinancialFlowData>({
    customerPayments: 0,
    grossOrderValue: 0,
    discounts: 0,
    refunds: 0,
    netOrderValue: 0,
    grabitCommission: 0,
    vendorEarnings: 0,
    settledAmount: 0,
    vendorPayouts: 0,
    configuredCommissionPct: 10,
  });

  const [analytics, setAnalytics] = useState<{
    chartPoints: RevenueChartPoint[];
    highestRevenueDay: { date: string; revenue: number };
    highestGmvDay: { date: string; gmv: number };
    highestOrderDay: { date: string; orders: number };
  }>({
    chartPoints: [],
    highestRevenueDay: { date: "N/A", revenue: 0 },
    highestGmvDay: { date: "N/A", gmv: 0 },
    highestOrderDay: { date: "N/A", orders: 0 },
  });

  const [vendors, setVendors] = useState<VendorFinancialItem[]>([]);
  const [anomalies, setAnomalies] = useState<FinancialAnomalyItem[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationItem[]>([]);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [campusFilter, setCampusFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      params.set("timeframe", timeframe);
      if (search.trim()) params.set("search", search.trim());
      if (campusFilter !== "ALL") params.set("campusId", campusFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/superadmin/finance?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setStats(data.stats);
        setFlow(data.flow);
        setAnalytics(data.analytics);
        setVendors(data.vendorDirectory);
        setAnomalies(data.anomalies);
        setReconciliation(data.reconciliation);
      } else {
        setErrorMsg(data.error || "Failed to load financial command telemetry.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error loading financial command data.");
    } finally {
      setLoading(false);
    }
  }, [timeframe, search, campusFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Supabase Realtime listener on `orders` and `vendor_settlements`
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("superadmin_finance_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vendor_settlements" },
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
      const res = await fetch(`/api/superadmin/finance/export?timeframe=${timeframe}`);
      if (!res.ok) throw new Error("CSV Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grabit_financial_report_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err?.message || "Failed to export financial report.");
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Financial Command Center</h1>
            <span className="bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Ledger Telemetry
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Monitor platform GMV, revenue, commission collections, vendor earnings, payouts, and financial reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold text-orange-400 focus:outline-none focus:border-orange-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
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

      {/* Overview KPI Cards */}
      <FinancialOverviewCards stats={stats} loading={loading && vendors.length === 0} />

      {/* Step-by-Step Financial Flow Pipeline */}
      <FinancialFlowVisualizer flow={flow} />

      {/* Revenue & GMV Analytics Chart */}
      <RevenueAnalyticsChart analytics={analytics} />

      {/* Vendor Directory Filter Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendor financial records by canteen or campus..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none"
            >
              <option value="ALL">All Settlement Statuses</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
            </select>

            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
              className="px-3 py-2 border border-zinc-800 bg-zinc-950 text-zinc-300 text-xs font-medium rounded-lg"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Vendor Financial Directory */}
      <VendorFinancialTable vendors={vendors} loading={loading && vendors.length === 0} />

      {/* Financial Anomalies & Reconciliation Matrix */}
      <FinancialAnomaliesPanel anomalies={anomalies} reconciliation={reconciliation} />
    </div>
  );
}
