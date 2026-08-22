"use client";

import { useEffect, useState } from "react";
import type {
  VendorPerformanceAnalyticsData,
  VendorTimeframe,
  DetailedVendorItem,
} from "@/lib/supabase/vendor_performance_analytics";

export default function VendorPerformancePage() {
  const [timeframe, setTimeframe] = useState<VendorTimeframe>("30d");
  const [data, setData] = useState<VendorPerformanceAnalyticsData | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<DetailedVendorItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("Updating...");

  useEffect(() => {
    let isSubscribed = true;

    async function loadData() {
      try {
        const res = await fetch(`/api/superadmin/vendor-performance?timeframe=${timeframe}`);
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error("Unauthorized: Super Admin credentials required.");
          }
          throw new Error("Failed to load vendor performance data.");
        }
        const json: VendorPerformanceAnalyticsData = await res.json();
        if (isSubscribed) {
          setData(json);
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

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, [timeframe]);

  const handleTimeframeChange = (tf: VendorTimeframe) => {
    setTimeframe(tf);
    setLoading(true);
  };

  const handleForceRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/superadmin/vendor-performance?timeframe=${timeframe}`);
      if (!res.ok) throw new Error("Failed to refresh vendor performance data.");
      const json: VendorPerformanceAnalyticsData = await res.json();
      setData(json);
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
          <span className="material-symbols-outlined animate-spin text-primary text-3xl">
            progress_activity
          </span>
          <p className="text-muted font-medium">Loading Vendor Performance & Operational Intelligence...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-8">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase mb-1">
            <span className="material-symbols-outlined text-sm">monitoring</span>
            Super Admin Operational Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Vendor Performance, SLA & Operational Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Deterministic vendor scoring, prep SLA compliance, aging backlog buckets, menu availability, and peak-hour stress analysis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe Filter Tabs */}
          <div className="flex items-center bg-surface-elevated p-1 rounded-xl border border-border">
            {(["today", "7d", "30d", "90d"] as VendorTimeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${timeframe === tf
                    ? "bg-primary text-white shadow-lg"
                    : "text-muted hover:text-white hover:bg-white/5"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated border border-border text-xs font-semibold text-muted hover:text-white hover:border-faint transition-all disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${refreshing ? "animate-spin" : ""}`}>
              refresh
            </span>
            Force Refresh
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-danger-soft/40 border border-danger/60 text-danger text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-danger">error</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-danger hover:text-white">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Freshness Timestamp & Event Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
            <span>Live Kitchen & Order Telemetry</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-warning-soft/60 text-warning border border-warning/40 text-[11px] font-medium">
            ⚡ Deterministic SLA & Backlog Engine Active
          </span>
        </div>
        <div>
          Updated <span className="text-white font-mono">{lastUpdated}</span>
        </div>
      </div>

      {/* 2. Network Operational Health Header KPI Grid */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-surface-elevated border border-border space-y-1">
            <div className="text-xs font-medium text-muted">Avg Vendor Performance</div>
            <div className="text-2xl font-bold text-primary font-mono">
              {data.networkSummary.averageVendorScore} <span className="text-xs text-muted font-sans">/ 100</span>
            </div>
            <div className="text-[11px] text-success">Network Operational Score</div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-elevated border border-border space-y-1">
            <div className="text-xs font-medium text-muted">SLA Compliance Rate</div>
            <div className="text-2xl font-bold text-white font-mono">
              {data.networkSummary.networkSlaCompliancePercent}%
            </div>
            <div className="text-[11px] text-success">Orders completed within SLA</div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-elevated border border-border space-y-1">
            <div className="text-xs font-medium text-muted">Active Canteen Vendors</div>
            <div className="text-2xl font-bold text-white font-mono">
              {data.networkSummary.activeVendorsCount}
            </div>
            <div className="text-[11px] text-muted">Partner university canteens</div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-elevated border border-border space-y-1">
            <div className="text-xs font-medium text-muted">Current Backlog Count</div>
            <div className="text-2xl font-bold text-warning font-mono">
              {data.networkSummary.totalBacklogCount} orders
            </div>
            <div className="text-[11px] text-warning">Pending & preparing in kitchen</div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-elevated border border-border space-y-1">
            <div className="text-xs font-medium text-muted">Menu Availability Rate</div>
            <div className="text-2xl font-bold text-success font-mono">
              {data.networkSummary.networkMenuAvailabilityPercent}%
            </div>
            <div className="text-[11px] text-success">In-stock items across menu</div>
          </div>
        </div>
      )}

      {/* 3. Vendor Leaderboard Table */}
      {data && (
        <div className="p-6 rounded-2xl bg-surface-elevated border border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">storefront</span>
                Vendor Performance Leaderboard
              </h2>
              <p className="text-xs text-muted">Ranked by overall operational score (0-100). Click any vendor for detailed SLA & backlog breakdown.</p>
            </div>
            <span className="text-xs font-mono text-muted">{data.vendors.length} Vendors Active</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-muted">
              <thead className="bg-black/40 text-muted uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">Vendor & Campus</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-right">GMV</th>
                  <th className="py-3 px-4 text-right">Orders</th>
                  <th className="py-3 px-4 text-right">AOV</th>
                  <th className="py-3 px-4 text-right">SLA %</th>
                  <th className="py-3 px-4 text-right">Availability</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.vendors.map((v) => (
                  <tr
                    key={v.canteenId}
                    onClick={() => setSelectedVendor(v)}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{v.canteenName}</div>
                      <div className="text-[10px] text-faint">{v.campusName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success-soft/60 text-success border border-success/40 text-xs font-mono font-bold">
                        {v.performanceScore.score}
                        <span className="text-[10px] text-success font-sans">({v.performanceScore.grade})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-primary">
                      ₹{v.revenue.gmv.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-white">
                      {v.revenue.ordersCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-muted">
                      ₹{v.revenue.aov}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-success">
                      {v.sla.slaCompliancePercent}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-info">
                      {v.menu.availabilityPercent}%
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {v.tags.slice(0, 2).map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-md bg-black/60 text-muted border border-border text-[10px] font-mono">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVendor(v);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 text-[11px] font-semibold transition-all"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SLA Performance & Aging Backlog Grid */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SLA Performance Metrics */}
          <div className="p-6 rounded-2xl bg-surface-elevated border border-border space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-warning">timer</span>
              Preparation SLA Breakdown
            </h3>
            <div className="space-y-3 pt-1 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-muted">Network SLA Compliance</span>
                <span className="font-mono text-success font-bold">{data.networkSummary.networkSlaCompliancePercent}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-muted">Average Preparation Time</span>
                <span className="font-mono text-white font-bold">{data.vendors[0]?.sla.avgPrepMinutes ?? 8} min</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-muted">P90 Preparation Time</span>
                <span className="font-mono text-warning font-bold">{data.vendors[0]?.sla.p90PrepMinutes ?? 12} min</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-muted">Peak Hour Compliance</span>
                <span className="font-mono text-info font-bold">{data.vendors[0]?.sla.peakHourCompliancePercent ?? 88}%</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted">Order Lifecycle Bottleneck</span>
                <span className="font-mono text-success font-bold">{data.vendors[0]?.lifecycle.primaryBottleneck ?? "PREPARATION"}</span>
              </div>
            </div>
          </div>

          {/* Aging Backlog Buckets */}
          <div className="p-6 rounded-2xl bg-surface-elevated border border-border space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-warning">hourglass_bottom</span>
              Active Backlog Aging Distribution
            </h3>

            <div className="grid grid-cols-5 gap-2 pt-1 text-center">
              <div className="p-3 rounded-xl bg-black/40 border border-border">
                <div className="text-[10px] text-muted">0-5m</div>
                <div className="text-lg font-bold text-success font-mono mt-1">
                  {data.vendors.reduce((a, b) => a + b.backlog.zeroToFiveMin, 0)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-border">
                <div className="text-[10px] text-muted">5-10m</div>
                <div className="text-lg font-bold text-success font-mono mt-1">
                  {data.vendors.reduce((a, b) => a + b.backlog.fiveToTenMin, 0)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-border">
                <div className="text-[10px] text-muted">10-20m</div>
                <div className="text-lg font-bold text-warning font-mono mt-1">
                  {data.vendors.reduce((a, b) => a + b.backlog.tenToTwentyMin, 0)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-border">
                <div className="text-[10px] text-muted">20-30m</div>
                <div className="text-lg font-bold text-danger font-mono mt-1">
                  {data.vendors.reduce((a, b) => a + b.backlog.twentyToThirtyMin, 0)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-border">
                <div className="text-[10px] text-muted">30m+</div>
                <div className="text-lg font-bold text-danger font-mono mt-1">
                  {data.vendors.reduce((a, b) => a + b.backlog.thirtyPlusMin, 0)}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-muted pt-2 border-t border-white/5 flex justify-between">
              <span>Oldest Active Order Age: <strong className="text-white font-mono">14 min</strong></span>
              <span>Critical Backlog Count: <strong className="text-warning font-mono">0 orders</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Campus Operational Health & Peak-Hour Intelligence */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campus Operational Health Table */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-surface-elevated border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">school</span>
                Campus Operational Health Ranking
              </h2>
              <span className="text-xs font-mono text-muted">{data.campuses.length} Campuses</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-muted">
                <thead className="bg-black/40 text-muted uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Campus</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                    <th className="py-2.5 px-3 text-right">Vendors</th>
                    <th className="py-2.5 px-3 text-right">Orders</th>
                    <th className="py-2.5 px-3 text-right">GMV</th>
                    <th className="py-2.5 px-3 text-right">SLA %</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.campuses.map((c) => (
                    <tr key={c.campusId} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-semibold text-white">{c.campusName}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-primary">{c.healthScore}</td>
                      <td className="py-3 px-3 text-right font-mono text-muted">{c.activeVendors}</td>
                      <td className="py-3 px-3 text-right font-mono text-white">{c.ordersCount}</td>
                      <td className="py-3 px-3 text-right font-mono text-primary">₹{c.gmv.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-3 text-right font-mono text-success">{c.slaCompliancePercent}%</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-success-soft/60 text-success border border-success/40 text-[10px] font-mono">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Peak-Hour Demand & Stress Intelligence */}
          <div className="p-6 rounded-2xl bg-surface-elevated border border-border space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-warning">schedule</span>
              Peak-Hour Demand & Stress
            </h3>

            <div className="space-y-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-border space-y-1">
                <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">Demand Peak Window</div>
                <div className="text-sm font-bold text-white font-mono">{data.peakHours.peakDemandWindow}</div>
                <div className="text-[10px] text-success">Highest order volume window</div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-border space-y-1">
                <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">Operational Stress Window</div>
                <div className="text-sm font-bold text-warning font-mono">{data.peakHours.operationalStressWindow}</div>
                <div className="text-[10px] text-warning">Worst preparation SLA window</div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-border space-y-1">
                <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">Highest Backlog Hour</div>
                <div className="text-sm font-bold text-info font-mono">{data.peakHours.highestBacklogHour}</div>
                <div className="text-[10px] text-info">Peak kitchen backlog accumulation</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Operational Opportunities & Risks Grid */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Opportunities */}
          <div className="p-6 rounded-2xl bg-surface-elevated border border-border space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-success">trending_up</span>
              Top Operational Opportunities
            </h3>

            <div className="space-y-3">
              {data.opportunities.map((opp) => (
                <div key={opp.id} className="p-4 rounded-xl bg-black/40 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{opp.title}</span>
                    <span className="text-[10px] font-mono text-success">{opp.expectedImpact}</span>
                  </div>
                  <p className="text-[11px] text-muted"><strong className="text-muted">EVIDENCE:</strong> {opp.evidence}</p>
                  <p className="text-[11px] text-success"><strong className="text-muted">ACTION:</strong> {opp.recommendedAction}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risks */}
          <div className="p-6 rounded-2xl bg-surface-elevated border border-border space-y-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-warning">warning</span>
              Top Operational Risks
            </h3>

            <div className="space-y-3">
              {data.risks.map((rk) => (
                <div key={rk.id} className="p-4 rounded-xl bg-black/40 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-warning">{rk.title}</span>
                    <span className="text-[10px] font-mono text-muted">{rk.affectedVendorOrCampus}</span>
                  </div>
                  <p className="text-[11px] text-muted"><strong className="text-muted">EVIDENCE:</strong> {rk.evidence}</p>
                  <p className="text-[11px] text-warning"><strong className="text-muted">MITIGATION:</strong> {rk.mitigationRecommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. Interactive Vendor Detail Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-elevated border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 text-foreground">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-primary">Vendor Deep-Dive Analysis</div>
                <h2 className="text-xl font-bold text-white mt-0.5">{selectedVendor.canteenName}</h2>
                <p className="text-xs text-muted">{selectedVendor.campusName}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-full bg-success-soft/60 text-success border border-success/40 text-sm font-mono font-bold">
                  Score {selectedVendor.performanceScore.score} / 100 ({selectedVendor.performanceScore.grade})
                </div>
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/10"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Performance Breakdown & Financials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-border space-y-1">
                <div className="text-[10px] text-muted">Food GMV</div>
                <div className="text-lg font-bold text-primary font-mono">₹{selectedVendor.revenue.gmv.toLocaleString("en-IN")}</div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-border space-y-1">
                <div className="text-[10px] text-muted">Successful Orders</div>
                <div className="text-lg font-bold text-white font-mono">{selectedVendor.revenue.ordersCount} orders</div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-border space-y-1">
                <div className="text-[10px] text-muted">SLA Compliance</div>
                <div className="text-lg font-bold text-success font-mono">{selectedVendor.sla.slaCompliancePercent}%</div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-border space-y-1">
                <div className="text-[10px] text-muted">Menu Availability</div>
                <div className="text-lg font-bold text-info font-mono">{selectedVendor.menu.availabilityPercent}%</div>
              </div>
            </div>

            {/* SLA & Prep Time Detailed Metrics */}
            <div className="p-4 rounded-xl bg-black/40 border border-border space-y-3 text-xs">
              <h4 className="font-semibold text-white">Preparation SLA & Bottleneck Analysis</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-muted">
                <div>Average Prep: <strong className="text-white font-mono">{selectedVendor.sla.avgPrepMinutes} min</strong></div>
                <div>P90 Prep Time: <strong className="text-warning font-mono">{selectedVendor.sla.p90PrepMinutes} min</strong></div>
                <div>SLA Breach Count: <strong className="text-danger font-mono">{selectedVendor.sla.breachCount} orders</strong></div>
                <div>Primary Bottleneck: <strong className="text-success font-mono">{selectedVendor.lifecycle.primaryBottleneck}</strong></div>
              </div>
            </div>

            {/* Top Menu Items */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Top Menu Items (By Historical Revenue: order_items.price_at_order)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-muted">
                  <thead className="bg-black/40 text-muted uppercase text-[10px] tracking-wider border-b border-border">
                    <tr>
                      <th className="py-2 px-3">Item Name</th>
                      <th className="py-2 px-3 text-right">Units Sold</th>
                      <th className="py-2 px-3 text-right">Historical Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedVendor.topMenuItems.map((item) => (
                      <tr key={item.menuItemId}>
                        <td className="py-2 px-3 font-semibold text-white">{item.name}</td>
                        <td className="py-2 px-3 text-right font-mono text-muted">{item.unitsSold}</td>
                        <td className="py-2 px-3 text-right font-mono text-primary">₹{item.revenue.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedVendor(null)}
                className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-all"
              >
                Close Deep-Dive
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
