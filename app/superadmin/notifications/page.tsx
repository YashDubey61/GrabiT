"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  PersistentOperationalAlert,
  AlertStatus,
  AlertSeverity,
} from "@/lib/supabase/superadmin_alerts";

export default function SuperAdminNotificationsPage() {
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "ALL">("ALL");
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "ALL">("ALL");
  const [alerts, setAlerts] = useState<PersistentOperationalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      let url = "/api/superadmin/alerts?sync=true";
      if (statusFilter !== "ALL") {
        url += `&status=${statusFilter}`;
      }
      if (severityFilter !== "ALL") {
        url += `&severity=${severityFilter}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (json.ok && json.alerts) {
        setAlerts(json.alerts);
      } else {
        setError(json.error ?? "Failed to fetch operational notifications.");
      }
    } catch {
      setError("Network error fetching notifications.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    let isSubscribed = true;
    async function load() {
      try {
        setError(null);
        let url = "/api/superadmin/alerts?sync=true";
        if (statusFilter !== "ALL") {
          url += `&status=${statusFilter}`;
        }
        if (severityFilter !== "ALL") {
          url += `&severity=${severityFilter}`;
        }
        const res = await fetch(url);
        const json = await res.json();
        if (isSubscribed) {
          if (json.ok && json.alerts) {
            setAlerts(json.alerts);
          } else {
            setError(json.error ?? "Failed to fetch notifications.");
          }
        }
      } catch {
        if (isSubscribed) {
          setError("Network error fetching notifications.");
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isSubscribed = false;
    };
  }, [statusFilter, severityFilter]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      setActioningId(alertId);
      const res = await fetch(`/api/superadmin/alerts/${alertId}/acknowledge`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.ok) {
        await fetchAlerts();
      } else {
        alert(json.error ?? "Failed to acknowledge alert.");
      }
    } catch {
      alert("Network error acknowledging alert.");
    } finally {
      setActioningId(null);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      setActioningId(alertId);
      const res = await fetch(`/api/superadmin/alerts/${alertId}/resolve`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.ok) {
        await fetchAlerts();
      } else {
        alert(json.error ?? "Failed to resolve alert.");
      }
    } catch {
      alert("Network error resolving alert.");
    } finally {
      setActioningId(null);
    }
  };

  const openCount = alerts.filter((a) => a.status === "OPEN").length;
  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL" && a.status !== "RESOLVED").length;

  return (
    <main className="min-h-dvh bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page Header */}
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-heading-lg font-900 tracking-tight text-foreground">
                Super Admin Notification Center
              </h1>
              {criticalCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-3 py-1 text-label font-bold text-destructive animate-pulse">
                  {criticalCount} CRITICAL ALERT(S)
                </span>
              )}
            </div>
            <p className="mt-1 text-body text-muted">
              Actionable operational alerts, severity badges, acknowledgement, and resolution audit trail.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAlerts()}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2 text-label font-bold text-foreground transition-all hover:bg-surface hover:border-primary/50 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>
                refresh
              </span>
              <span>Sync & Refresh</span>
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-label font-bold text-destructive">
            {error}
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1 rounded-xl bg-surface p-1 text-label font-bold border border-border">
            {(["ALL", "OPEN", "ACKNOWLEDGED", "RESOLVED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setLoading(true);
                  setStatusFilter(st);
                }}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  statusFilter === st
                    ? "bg-primary text-background shadow"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {st === "ALL" ? "All Statuses" : st}
              </button>
            ))}
          </div>

          {/* Severity Dropdown Filter */}
          <div className="flex items-center gap-2">
            <span className="text-label font-semibold text-muted">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => {
                setLoading(true);
                setSeverityFilter(e.target.value as AlertSeverity | "ALL");
              }}
              className="rounded-xl border border-border bg-surface px-3 py-1.5 text-label font-bold text-foreground focus:border-primary focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="WARNING">Warning Only</option>
              <option value="INFO">Info Only</option>
            </select>
          </div>
        </div>

        {/* Operational Alerts List */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">
              progress_activity
            </span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-elevated p-12 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-success">
              check_circle
            </span>
            <h3 className="font-display text-heading-sm font-bold text-foreground">
              No Matching Notifications Found
            </h3>
            <p className="text-body text-muted max-w-md mx-auto">
              All system parameters are operating normally. No alerts match the current filter selection.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-label font-bold text-muted px-1">
              <span>Showing {alerts.length} Notification(s)</span>
              <span>{openCount} Open Alert(s) Remaining</span>
            </div>

            <div className="grid gap-4">
              {alerts.map((alertItem: PersistentOperationalAlert) => {
                const isCritical = alertItem.severity === "CRITICAL";
                const isWarning = alertItem.severity === "WARNING";
                const isOpen = alertItem.status === "OPEN";
                const isAcknowledged = alertItem.status === "ACKNOWLEDGED";
                const isResolved = alertItem.status === "RESOLVED";

                const isBusy = actioningId === alertItem.id;

                return (
                  <div
                    key={alertItem.id}
                    className={`flex flex-col gap-4 rounded-2xl border p-5 transition-all ${
                      isCritical
                        ? "border-destructive/40 bg-destructive/10 text-foreground"
                        : isWarning
                        ? "border-warning/40 bg-warning/10 text-foreground"
                        : "border-success/30 bg-success/5 text-foreground"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <span
                          className={`material-symbols-outlined mt-1 text-[24px] ${
                            isCritical
                              ? "text-destructive"
                              : isWarning
                              ? "text-warning"
                              : "text-success"
                          }`}
                        >
                          {isCritical ? "error" : isWarning ? "warning" : "info"}
                        </span>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display text-body-lg font-800 text-foreground">
                              {alertItem.title}
                            </span>
                            {/* Severity Badge */}
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                isCritical
                                  ? "bg-destructive/20 text-destructive border border-destructive/40"
                                  : isWarning
                                  ? "bg-warning/20 text-warning border border-warning/40"
                                  : "bg-success/20 text-success border border-success/40"
                              }`}
                            >
                              {alertItem.severity}
                            </span>

                            {/* Status Badge */}
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                isOpen
                                  ? "bg-info/20 text-info border border-info/40"
                                  : isAcknowledged
                                  ? "bg-warning/20 text-warning border border-warning/40"
                                  : "bg-success/20 text-success border border-success/40"
                              }`}
                            >
                              {alertItem.status}
                            </span>
                          </div>

                          <p className="text-body text-muted leading-relaxed">
                            {alertItem.description}
                          </p>

                          {/* Audit Trail Metadata */}
                          <div className="flex flex-wrap items-center gap-4 pt-2 text-label text-muted font-semibold">
                            <span>
                              Created: {new Date(alertItem.created_at).toLocaleString("en-IN")}
                            </span>
                            {alertItem.acknowledged_at && (
                              <span className="text-warning">
                                Acknowledged: {new Date(alertItem.acknowledged_at).toLocaleTimeString("en-IN")}
                              </span>
                            )}
                            {alertItem.resolved_at && (
                              <span className="text-success">
                                Resolved: {new Date(alertItem.resolved_at).toLocaleTimeString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                        {isOpen && (
                          <button
                            onClick={() => handleAcknowledge(alertItem.id)}
                            disabled={isBusy}
                            className="rounded-xl border border-warning/50 bg-warning/10 px-3 py-1.5 text-label font-bold text-warning hover:bg-warning/20 transition-colors disabled:opacity-50"
                          >
                            Acknowledge
                          </button>
                        )}
                        {!isResolved && (
                          <button
                            onClick={() => handleResolve(alertItem.id)}
                            disabled={isBusy}
                            className="rounded-xl border border-success/50 bg-success/10 px-3 py-1.5 text-label font-bold text-success hover:bg-success/20 transition-colors disabled:opacity-50"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
