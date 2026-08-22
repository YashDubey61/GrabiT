"use client";

import { useEffect, useState } from "react";
import type {
  ReconciliationResult,
  ReconciliationCategory,
  ReconciliationSeverity,
  ReconciliationFinding,
} from "@/lib/supabase/financial_reconciliation";

export default function SuperAdminReconciliationPage() {
  const [timeframe, setTimeframe] = useState<"today" | "7d" | "30d">("today");
  const [categoryFilter, setCategoryFilter] = useState<ReconciliationCategory | "ALL">("ALL");
  const [severityFilter, setSeverityFilter] = useState<ReconciliationSeverity | "ALL">("ALL");
  const [data, setData] = useState<ReconciliationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    async function loadReconciliation() {
      try {
        setError(null);
        const res = await fetch(`/api/superadmin/reconciliation?timeframe=${timeframe}`);
        const json = await res.json();
        if (isSubscribed) {
          if (json.ok && json.result) {
            setData(json.result);
          } else {
            setError(json.error ?? "Failed to perform financial reconciliation.");
          }
        }
      } catch {
        if (isSubscribed) {
          setError("Network error running financial reconciliation.");
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    loadReconciliation();
    return () => {
      isSubscribed = false;
    };
  }, [timeframe]);

  const handleTimeframeChange = (tf: "today" | "7d" | "30d") => {
    setLoading(true);
    setTimeframe(tf);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setError(null);
      const res = await fetch(`/api/superadmin/reconciliation?timeframe=${timeframe}`);
      const json = await res.json();
      if (json.ok && json.result) {
        setData(json.result);
      } else {
        setError(json.error ?? "Failed to run audit.");
      }
    } catch {
      setError("Network error running financial reconciliation audit.");
    } finally {
      setRefreshing(false);
    }
  };

  const filteredFindings = (data?.findings ?? []).filter((f) => {
    if (categoryFilter !== "ALL" && f.category !== categoryFilter) return false;
    if (severityFilter !== "ALL" && f.severity !== severityFilter) return false;
    return true;
  });

  return (
    <main className="min-h-dvh bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page Header */}
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-heading-lg font-900 tracking-tight text-foreground">
                Financial Reconciliation & Payout Integrity
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-label font-bold text-primary">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                READ-ONLY AUDIT ENGINE
              </span>
            </div>
            <p className="mt-1 text-body text-muted">
              Deterministic audit of food orders, payment transactions, wallet ledgers, Razorpay webhooks, subscriptions, and vendor payouts.
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

            {/* Run Audit Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2 text-label font-bold text-foreground transition-all hover:bg-surface hover:border-primary/50 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${refreshing ? "animate-spin" : ""}`}>
                published_with_changes
              </span>
              <span>{refreshing ? "Auditing..." : "Run Audit"}</span>
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
            {/* Overall Financial Health Status Banner */}
            <div
              className={`flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between transition-all ${
                data.overallStatus === "CRITICAL"
                  ? "border-destructive/40 bg-destructive/10 text-foreground"
                  : data.overallStatus === "WARNING"
                  ? "border-warning/40 bg-warning/10 text-foreground"
                  : "border-success/30 bg-success/5 text-foreground"
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`material-symbols-outlined text-4xl ${
                    data.overallStatus === "CRITICAL"
                      ? "text-destructive"
                      : data.overallStatus === "WARNING"
                      ? "text-warning"
                      : "text-success"
                  }`}
                >
                  {data.overallStatus === "CRITICAL"
                    ? "gpp_bad"
                    : data.overallStatus === "WARNING"
                    ? "shield_with_house"
                    : "verified_user"}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-heading-sm font-900 tracking-tight">
                      Platform Financial Health: {data.overallStatus}
                    </h2>
                  </div>
                  <p className="mt-1 text-label text-muted">
                    Executed {data.totalChecks} financial checks. Passed: {data.passedChecks} | Warnings: {data.warningCount} | Critical Discrepancies: {data.criticalCount}
                  </p>
                </div>
              </div>

              <div className="text-label text-muted font-bold self-end sm:self-center">
                Last Reconciled: {new Date(data.lastReconciledAt).toLocaleTimeString("en-IN")}
              </div>
            </div>

            {/* Category Breakdown Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.categories.map((cat) => (
                <div
                  key={cat.category}
                  className="rounded-2xl border border-border bg-surface-elevated p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-label font-bold text-foreground">{cat.label}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                        cat.criticals > 0
                          ? "bg-destructive/20 text-destructive"
                          : cat.warnings > 0
                          ? "bg-warning/20 text-warning"
                          : "bg-success/20 text-success"
                      }`}
                    >
                      {cat.criticals > 0
                        ? "CRITICAL"
                        : cat.warnings > 0
                        ? "WARNING"
                        : "PASSED"}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-display-sm font-900 text-foreground">
                      {cat.passed} / {cat.total}
                    </span>
                    <span className="text-label text-muted font-bold">Checks Passed</span>
                  </div>

                  <div className="flex items-center justify-between text-label text-muted pt-2 border-t border-border">
                    <span>Warnings: <strong className="text-warning">{cat.warnings}</strong></span>
                    <span>Critical: <strong className="text-destructive">{cat.criticals}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Findings Section */}
            <section className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-display text-heading-sm font-800 text-foreground flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    fact_check
                  </span>
                  Reconciliation Findings ({filteredFindings.length})
                </h3>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Category Filter Dropdown */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as ReconciliationCategory | "ALL")}
                    className="rounded-xl border border-border bg-surface-elevated px-3 py-1.5 text-label font-bold text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="ORDERS">Food Orders</option>
                    <option value="PAYMENTS">Payments</option>
                    <option value="WALLETS">Wallet Ledgers</option>
                    <option value="RAZORPAY">Razorpay Webhooks</option>
                    <option value="SUBSCRIPTIONS">Gold Subscriptions</option>
                    <option value="PAYOUTS">Vendor Payouts</option>
                  </select>

                  {/* Severity Filter Dropdown */}
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value as ReconciliationSeverity | "ALL")}
                    className="rounded-xl border border-border bg-surface-elevated px-3 py-1.5 text-label font-bold text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="ALL">All Severities</option>
                    <option value="CRITICAL">Critical Only</option>
                    <option value="WARNING">Warning Only</option>
                    <option value="INFO">Info Only</option>
                  </select>
                </div>
              </div>

              {/* Findings Table */}
              <div className="rounded-2xl border border-border bg-surface-elevated p-4 overflow-x-auto">
                <table className="w-full text-left text-body">
                  <thead className="border-b border-border text-label font-bold text-muted uppercase">
                    <tr>
                      <th className="pb-3 px-3">Check Type</th>
                      <th className="pb-3 px-3">Category</th>
                      <th className="pb-3 px-3">Severity</th>
                      <th className="pb-3 px-3">Expected Value</th>
                      <th className="pb-3 px-3">Actual Value</th>
                      <th className="pb-3 px-3">Description</th>
                      <th className="pb-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-semibold">
                    {filteredFindings.map((f: ReconciliationFinding) => {
                      const isCritical = f.severity === "CRITICAL";
                      const isWarning = f.severity === "WARNING";

                      return (
                        <tr key={f.id} className="hover:bg-surface/50">
                          <td className="py-3.5 px-3 font-bold text-foreground">{f.type}</td>
                          <td className="py-3.5 px-3 text-label text-muted">{f.category}</td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                isCritical
                                  ? "bg-destructive/20 text-destructive"
                                  : isWarning
                                  ? "bg-warning/20 text-warning"
                                  : "bg-success/20 text-success"
                              }`}
                            >
                              {f.severity}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-label text-success">{f.expectedValue}</td>
                          <td className="py-3.5 px-3 text-label text-warning">{f.actualValue}</td>
                          <td className="py-3.5 px-3 text-label text-muted max-w-xs truncate">
                            {f.description}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => alert(`Investigating finding: ${f.type} (${f.entityId})`)}
                              className="rounded-xl border border-border bg-surface px-3 py-1 text-label font-bold text-foreground hover:border-primary transition-colors"
                            >
                              INVESTIGATE
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
