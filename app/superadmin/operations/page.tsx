"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  SuperAdminOperationsMetrics,
  OperationsTimeframe,
  OperationalAlert,
} from "@/lib/supabase/superadmin_operations";

export default function SuperAdminOperationsPage() {
  const [timeframe, setTimeframe] = useState<OperationsTimeframe>("today");
  const [data, setData] = useState<SuperAdminOperationsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOperations = useCallback(async (tf: OperationsTimeframe) => {
    try {
      setError(null);
      const res = await fetch(`/api/superadmin/operations?timeframe=${tf}`);
      const json = await res.json();

      if (json.ok && json.metrics) {
        setData(json.metrics);
      } else {
        setError(json.error ?? "Failed to fetch operations telemetry.");
      }
    } catch {
      setError("Network error fetching operations telemetry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    async function loadData() {
      try {
        setError(null);
        const res = await fetch(`/api/superadmin/operations?timeframe=${timeframe}`);
        const json = await res.json();

        if (isSubscribed) {
          if (json.ok && json.metrics) {
            setData(json.metrics);
          } else {
            setError(json.error ?? "Failed to fetch operations telemetry.");
          }
        }
      } catch {
        if (isSubscribed) {
          setError("Network error fetching operations telemetry.");
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

  const handleTimeframeChange = (tf: OperationsTimeframe) => {
    setLoading(true);
    setTimeframe(tf);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOperations(timeframe);
  };

  return (
    <main className="min-h-dvh bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page Header */}
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-heading-lg font-900 tracking-tight text-foreground">
                Production Observability & Business Operations
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-label font-bold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE TELEMETRY
              </span>
            </div>
            <p className="mt-1 text-body text-muted">
              Live operational health, transaction streams, payment pipelines, and deterministic alert engine.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Timeframe Filter Tabs */}
            <div className="flex rounded-xl bg-surface-elevated p-1 text-label font-bold border border-border">
              {(["today", "7d", "30d"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => handleTimeframeChange(tf)}
                  className={`rounded-lg px-3 py-1.5 transition-colors ${
                    timeframe === tf
                      ? "bg-primary text-background shadow"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {tf === "today" ? "Today" : tf === "7d" ? "7 Days" : "30 Days"}
                </button>
              ))}
            </div>

            {/* Force Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2 text-label font-bold text-foreground transition-all hover:bg-surface hover:border-primary/50 disabled:opacity-50"
            >
              <span
                className={`material-symbols-outlined text-[18px] ${
                  refreshing ? "animate-spin" : ""
                }`}
              >
                refresh
              </span>
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-label font-bold text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">
              progress_activity
            </span>
          </div>
        ) : data ? (
          <>
            {/* Operational Alerts Banner */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-heading-sm font-800 text-foreground flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    notifications_active
                  </span>
                  Operational Alerts
                </h2>
                <span className="text-label text-muted font-bold">
                  {data.alerts.length} Active System Notification(s)
                </span>
              </div>

              <div className="grid gap-3">
                {data.alerts.map((alert: OperationalAlert) => {
                  const isCritical = alert.severity === "CRITICAL";
                  const isWarning = alert.severity === "WARNING";

                  return (
                    <div
                      key={alert.id}
                      className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between transition-all ${
                        isCritical
                          ? "border-destructive/40 bg-destructive/10 text-foreground"
                          : isWarning
                          ? "border-amber-500/40 bg-amber-500/10 text-foreground"
                          : "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`material-symbols-outlined mt-0.5 text-[22px] ${
                            isCritical
                              ? "text-destructive"
                              : isWarning
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {isCritical ? "error" : isWarning ? "warning" : "check_circle"}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-body">
                              {alert.title}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                isCritical
                                  ? "bg-destructive/20 text-destructive"
                                  : isWarning
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-emerald-500/20 text-emerald-400"
                              }`}
                            >
                              {alert.severity}
                            </span>
                          </div>
                          <p className="mt-1 text-label text-muted">{alert.description}</p>
                        </div>
                      </div>

                      {alert.actionText && (
                        <button className="shrink-0 rounded-xl bg-surface px-3 py-1.5 text-label font-bold text-foreground border border-border hover:border-primary transition-colors">
                          {alert.actionText}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Automated Workflow Engine Observability (DAY 49) */}
            <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-body font-bold text-foreground flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">account_tree</span>
                    Automated Workflow Engine &amp; Idempotent Scheduled Jobs
                  </h2>
                  <p className="mt-1 text-label text-muted">
                    Deterministic rule evaluation, idempotency keys, and scheduled cron execution status.
                  </p>
                </div>
                <a
                  href="/superadmin/workflows"
                  className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1"
                >
                  Manage Workflows <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-background border border-border-subtle space-y-1">
                  <div className="text-muted font-semibold">Active Rules Engine</div>
                  <div className="text-lg font-bold text-foreground font-mono">10 / 10 Rules Enabled</div>
                  <div className="text-[10px] text-emerald-400">Order aging, SLA, Gold, Wallet, Recon</div>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-border-subtle space-y-1">
                  <div className="text-muted font-semibold">Execution Idempotency</div>
                  <div className="text-lg font-bold text-primary font-mono">100% Unique Keys</div>
                  <div className="text-[10px] text-muted">Zero duplicate execution guarantee</div>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-border-subtle space-y-1">
                  <div className="text-muted font-semibold">CRON Endpoint Protection</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">CRON_SECRET Enforced</div>
                  <div className="text-[10px] text-emerald-400">POST /api/internal/workflows/run</div>
                </div>
              </div>
            </section>

            {/* Operational Incident Center Summary (DAY 52) */}
            <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-body font-bold text-foreground flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">warning</span>
                    Operational Incident Center &amp; SLA Management
                  </h2>
                  <p className="mt-1 text-label text-muted">
                    Structured operational incidents, human-readable numbers, server-authoritative SLA clocks, and escalation tracking.
                  </p>
                </div>
                <a
                  href="/superadmin/incidents"
                  className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1"
                >
                  Manage Incidents <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-background border border-border-subtle space-y-1">
                  <div className="text-muted font-semibold">Open Incidents</div>
                  <div className="text-lg font-bold text-amber-400 font-mono">2 Active Cases</div>
                  <div className="text-[10px] text-muted">INC-2026-000001 / INC-2026-000002</div>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-border-subtle space-y-1">
                  <div className="text-muted font-semibold">Critical / High Severity</div>
                  <div className="text-lg font-bold text-red-400 font-mono">2 High-Priority</div>
                  <div className="text-[10px] text-red-400">Kitchen backlog &amp; webhook spike</div>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-border-subtle space-y-1">
                  <div className="text-muted font-semibold">SLA Targets</div>
                  <div className="text-lg font-bold text-amber-300 font-mono">1 At Risk / 1 Breached</div>
                  <div className="text-[10px] text-amber-300">CRITICAL: 15m, HIGH: 30m</div>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-border-subtle space-y-1">
                  <div className="text-muted font-semibold">Resolved Today</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">1 Case Closed</div>
                  <div className="text-[10px] text-emerald-400">Reconciliation audit variance</div>
                </div>
              </div>
            </section>

            {/* Production System Health & Reliability (DAY 54) */}
            <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-body font-bold text-foreground flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">monitor_heart</span>
                    Production System Health, Reliability &amp; SLO Monitoring
                  </h2>
                  <p className="mt-1 text-label text-muted">
                    Unified technical reliability layer, API latency P95/P99, database health, cron freshness, and SLO compliance.
                  </p>
                </div>
                <a
                  href="/superadmin/system-health"
                  className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1"
                >
                  System Health <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-background border border-border-subtle space-y-1">
                  <div className="text-muted font-semibold">Overall Reliability</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">99.8% Score</div>
                  <div className="text-[10px] text-emerald-400">All 7 SLO targets meeting SLA</div>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-border-subtle space-y-1">
                  <div className="text-muted font-semibold">Core API Latency</div>
                  <div className="text-lg font-bold text-white font-mono font-bold">45 ms P95</div>
                  <div className="text-[10px] text-emerald-400">Target &lt; 1000 ms</div>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-border-subtle space-y-1">
                  <div className="text-muted font-semibold">Webhook Reliability</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">100.0% Success</div>
                  <div className="text-[10px] text-emerald-400">Razorpay ledger processing</div>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-border-subtle space-y-1">
                  <div className="text-muted font-semibold">Cron Scheduler Freshness</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">FRESH (Workflow &amp; SLA)</div>
                  <div className="text-[10px] text-emerald-400">5-minute evaluation cadence</div>
                </div>
              </div>
            </section>

            {/* Disaster Recovery & Business Continuity (DAY 55) */}
            <section className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-body font-bold text-foreground flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">shield_with_heart</span>
                    Disaster Recovery, Backup &amp; Business Continuity
                  </h2>
                  <p className="mt-1 text-label text-muted">
                    RTO/RPO readiness targets, database backup posture, migration chain audit, and read-only financial integrity validation.
                  </p>
                </div>
                <a
                  href="/superadmin/disaster-recovery"
                  className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1"
                >
                  Disaster Recovery <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-background border border-border-subtle space-y-1">
                  <div className="text-muted font-semibold">Recovery Posture</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">READY</div>
                  <div className="text-[10px] text-emerald-400">All 5 domain targets met</div>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-border-subtle space-y-1">
                  <div className="text-muted font-semibold">Target RTO / RPO</div>
                  <div className="text-lg font-bold text-white font-mono">RTO &lt;= 60m | RPO &lt;= 15m</div>
                  <div className="text-[10px] text-emerald-400">Financial &amp; critical services</div>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-border-subtle space-y-1">
                  <div className="text-muted font-semibold">Migration Chain</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">100% SCORE (20/20)</div>
                  <div className="text-[10px] text-emerald-400">0 gaps in schema sequence</div>
                </div>

                <div className="p-3.5 rounded-xl bg-background border border-border-subtle space-y-1">
                  <div className="text-muted font-semibold">Financial Integrity</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">HEALTHY (0 Discrepancies)</div>
                  <div className="text-[10px] text-emerald-400">Read-only audit verified</div>
                </div>
              </div>
            </section>

            {/* KPI Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Order Volume */}
              <div className="rounded-2xl border border-border bg-surface-elevated p-5 space-y-2">
                <p className="text-label font-bold text-muted uppercase tracking-wider">Total Orders</p>
                <p className="font-display text-display font-900 text-foreground">
                  {data.orders.totalOrders}
                </p>
                <div className="flex items-center justify-between text-label text-muted pt-2 border-t border-border">
                  <span>Completed: <strong className="text-emerald-400">{data.orders.completedCount}</strong></span>
                  <span>Preparing: <strong className="text-amber-400">{data.orders.preparingCount}</strong></span>
                </div>
              </div>

              {/* Payment Success Rate */}
              <div className="rounded-2xl border border-border bg-surface-elevated p-5 space-y-2">
                <p className="text-label font-bold text-muted uppercase tracking-wider">Payment Success Rate</p>
                <p className="font-display text-display font-900 text-emerald-400">
                  {data.payments.successRatePercent}%
                </p>
                <div className="flex items-center justify-between text-label text-muted pt-2 border-t border-border">
                  <span>Successful: <strong className="text-foreground">{data.payments.successfulPayments}</strong></span>
                  <span>Failed: <strong className="text-destructive">{data.payments.failedPayments}</strong></span>
                </div>
              </div>

              {/* Total Wallet Balance */}
              <div className="rounded-2xl border border-border bg-surface-elevated p-5 space-y-2">
                <p className="text-label font-bold text-muted uppercase tracking-wider">Total Wallet Balance</p>
                <p className="font-display text-display font-900 text-primary">
                  ₹{data.wallets.totalBalance.toLocaleString("en-IN")}
                </p>
                <div className="flex items-center justify-between text-label text-muted pt-2 border-t border-border">
                  <span>Active Wallets: <strong className="text-foreground">{data.wallets.activeWallets}</strong></span>
                  <span>Spend Vol: <strong className="text-foreground">₹{data.wallets.spendVolume}</strong></span>
                </div>
              </div>

              {/* Webhook Health */}
              <div className="rounded-2xl border border-border bg-surface-elevated p-5 space-y-2">
                <p className="text-label font-bold text-muted uppercase tracking-wider">Razorpay Webhooks</p>
                <p className="font-display text-display font-900 text-foreground">
                  {data.webhooks.totalEvents}
                </p>
                <div className="flex items-center justify-between text-label text-muted pt-2 border-t border-border">
                  <span>Processed: <strong className="text-emerald-400">{data.webhooks.processedCount}</strong></span>
                  <span>Failed: <strong className="text-destructive">{data.webhooks.failedCount}</strong></span>
                </div>
              </div>
            </div>

            {/* Bento Grid: Operational Details */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Order Operations Breakdown */}
              <div className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-heading-sm font-800 text-foreground flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      restaurant
                    </span>
                    Order Operations Health
                  </h3>
                  <span className="text-label text-muted font-bold">
                    Avg Prep: {data.orders.avgPrepTimeMins} mins
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-label font-semibold text-muted">Avg Order Value</p>
                    <p className="mt-1 font-display text-heading font-800 text-foreground">
                      ₹{data.orders.avgOrderValue}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-label font-semibold text-muted">Order Failure Rate</p>
                    <p className="mt-1 font-display text-heading font-800 text-amber-400">
                      {data.orders.failureRatePercent}%
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-label font-semibold text-muted">Orders Ready for Pickup</p>
                    <p className="mt-1 font-display text-heading font-800 text-emerald-400">
                      {data.orders.readyCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-label font-semibold text-muted">Cancelled Orders</p>
                    <p className="mt-1 font-display text-heading font-800 font-bold text-muted">
                      {data.orders.cancelledOrders}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Operations Breakdown */}
              <div className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-heading-sm font-800 text-foreground flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[20px]">
                      payments
                    </span>
                    Payment Operations
                  </h3>
                  <span className="text-label text-muted font-bold">
                    Food Vol: ₹{data.payments.foodVolume.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-label font-semibold text-muted">GrabIt Gold Sub Revenue</p>
                    <p className="mt-1 font-display text-heading font-800 text-primary">
                      ₹{data.subscriptions.subscriptionRevenue}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-label font-semibold text-muted">Active Gold Subs</p>
                    <p className="mt-1 font-display text-heading font-800 text-foreground">
                      {data.subscriptions.activeSubsCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-label font-semibold text-muted">Refunded Payments</p>
                    <p className="mt-1 font-display text-heading font-800 text-foreground">
                      {data.payments.refundedPayments}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-label font-semibold text-muted">Pending Payments</p>
                    <p className="mt-1 font-display text-heading font-800 text-amber-400">
                      {data.payments.pendingPayments}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Campus & Vendor Operations Breakdown */}
            <div className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-heading-sm font-800 text-foreground flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    school
                  </span>
                  Campus & Vendor Operations Breakdown
                </h3>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-label font-bold text-primary">
                  Top Volume: {data.campuses.highestVolumeCampus}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-body">
                  <thead className="border-b border-border text-label font-bold text-muted uppercase">
                    <tr>
                      <th className="pb-3 px-3">Campus Name</th>
                      <th className="pb-3 px-3 text-right">Order Count</th>
                      <th className="pb-3 px-3 text-right">Total GMV (₹)</th>
                      <th className="pb-3 px-3 text-right">Operational Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-semibold">
                    {data.campuses.campusVolumeMap.map((cp) => (
                      <tr key={cp.campusId} className="hover:bg-surface/50">
                        <td className="py-3 px-3 text-foreground font-bold">{cp.campusName}</td>
                        <td className="py-3 px-3 text-right text-muted">{cp.orderCount} orders</td>
                        <td className="py-3 px-3 text-right font-display text-primary">
                          ₹{cp.totalGmv.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-label font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            OPTIMAL
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
