"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  PersistentOperationalAlert,
  AlertStatus,
  AlertSeverity,
} from "@/lib/supabase/superadmin_alerts";

interface CampusOption {
  id: string;
  name: string;
}

interface StudentOption {
  id: string;
  phone: string;
  full_name: string | null;
  grabit_user_id: string | null;
  campus_id: string | null;
}

interface BroadcastItem {
  id: string;
  title: string;
  message: string;
  type: string;
  action_url: string | null;
  created_at: string;
  user_id: string;
}

export default function SuperAdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<"broadcast" | "history" | "alerts">("broadcast");

  // Broadcast Composer State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetScope, setTargetScope] = useState<"all" | "campus" | "student">("all");
  const [selectedCampusId, setSelectedCampusId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    ok: boolean;
    message: string;
    details?: { targeted: number; dispatched: number; failed: number };
  } | null>(null);

  // Metadata for Selectors & History
  const [campuses, setCampuses] = useState<CampusOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastItem[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);

  // Operational Alerts State
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "ALL">("ALL");
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "ALL">("ALL");
  const [alerts, setAlerts] = useState<PersistentOperationalAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [errorAlerts, setErrorAlerts] = useState<string | null>(null);

  // Fetch Broadcast Meta & History
  const loadBroadcastData = useCallback(async () => {
    try {
      setIsLoadingMeta(true);
      const res = await fetch("/api/superadmin/notifications/broadcast");
      const json = await res.json();
      if (json.ok) {
        setCampuses(json.campuses || []);
        setStudents(json.students || []);
        setBroadcastHistory(json.recentBroadcasts || []);
        if (json.campuses && json.campuses.length > 0 && !selectedCampusId) {
          setSelectedCampusId(json.campuses[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load broadcast meta:", err);
    } finally {
      setIsLoadingMeta(false);
    }
  }, [selectedCampusId]);

  // Fetch Operational Alerts
  const fetchAlerts = useCallback(async () => {
    try {
      setErrorAlerts(null);
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
        setErrorAlerts(json.error ?? "Failed to fetch operational notifications.");
      }
    } catch {
      setErrorAlerts("Network error fetching notifications.");
    } finally {
      setLoadingAlerts(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    loadBroadcastData();
  }, [loadBroadcastData]);

  useEffect(() => {
    if (activeTab === "alerts") {
      fetchAlerts();
    }
  }, [activeTab, fetchAlerts]);

  // Send Broadcast Handler
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setSendResult({ ok: false, message: "Please fill in both title and message." });
      return;
    }

    try {
      setIsSending(true);
      setSendResult(null);

      const res = await fetch("/api/superadmin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          targetScope,
          campusId: targetScope === "campus" ? selectedCampusId : undefined,
          studentId: targetScope === "student" ? selectedStudentId : undefined,
          actionUrl: actionUrl.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        setSendResult({
          ok: true,
          message: json.message || "Notification sent successfully.",
          details: {
            targeted: json.totalTargetedStudents,
            dispatched: json.dispatchedCount,
            failed: json.failedCount,
          },
        });
        setTitle("");
        setMessage("");
        setActionUrl("");
        await loadBroadcastData();
      } else {
        setSendResult({
          ok: false,
          message: json.error || "Failed to dispatch notification.",
        });
      }
    } catch {
      setSendResult({
        ok: false,
        message: "Network error transmitting notification.",
      });
    } finally {
      setIsSending(false);
    }
  };

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

  // Target estimation calculation
  const estimatedTargetCount = () => {
    if (targetScope === "all") return students.length;
    if (targetScope === "campus") {
      return students.filter((s) => s.campus_id === selectedCampusId).length;
    }
    return selectedStudentId ? 1 : 0;
  };

  const openAlertsCount = alerts.filter((a) => a.status === "OPEN").length;
  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL" && a.status !== "RESOLVED").length;

  return (
    <main className="min-h-dvh bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Page Header */}
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-heading-lg font-900 tracking-tight text-foreground">
                Super Admin Notifications
              </h1>
              {criticalCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-3 py-1 text-label font-bold text-destructive animate-pulse">
                  {criticalCount} CRITICAL ALERT(S)
                </span>
              )}
            </div>
            <p className="mt-1 text-body text-muted">
              Compose custom student push broadcasts, target campuses, and manage live operational telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadBroadcastData();
                if (activeTab === "alerts") fetchAlerts();
              }}
              disabled={isLoadingMeta || (activeTab === "alerts" && loadingAlerts)}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2 text-label font-bold text-foreground transition-all hover:bg-surface hover:border-primary/50 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${isLoadingMeta ? "animate-spin" : ""}`}>
                refresh
              </span>
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex border-b border-border gap-2">
          <button
            onClick={() => setActiveTab("broadcast")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-display text-body-sm font-bold transition-all ${
              activeTab === "broadcast"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            <span>Compose Push Broadcast</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-display text-body-sm font-bold transition-all ${
              activeTab === "history"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            <span>Broadcast Audit ({broadcastHistory.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-display text-body-sm font-bold transition-all ${
              activeTab === "alerts"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">emergency_home</span>
            <span>System Operational Alerts ({openAlertsCount})</span>
          </button>
        </div>

        {/* TAB 1: COMPOSE PUSH NOTIFICATION */}
        {activeTab === "broadcast" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-border bg-surface-elevated/80 p-6 backdrop-blur-md shadow-lg">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      campaign
                    </span>
                    <h2 className="font-display text-heading font-800 text-foreground">
                      Compose Student Push Notification
                    </h2>
                  </div>
                  <span className="text-caption text-muted bg-surface px-3 py-1 rounded-full border border-border">
                    Firebase Cloud Messaging v1
                  </span>
                </div>

                <form onSubmit={handleSendBroadcast} className="mt-6 space-y-5">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label htmlFor="broadcast-title" className="block font-display text-body-sm font-bold text-foreground">
                      Notification Title <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="broadcast-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. GRABIT Campus Announcement 🍔"
                      className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-body text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  {/* Message Body */}
                  <div className="space-y-1.5">
                    <label htmlFor="broadcast-message" className="block font-display text-body-sm font-bold text-foreground">
                      Message Body <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      id="broadcast-message"
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="e.g. New food stalls are now live on your campus! Grab ₹50 off with code CAMPUS50."
                      className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-body text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                      required
                    />
                  </div>

                  {/* Recipient Scope */}
                  <div className="space-y-2">
                    <label className="block font-display text-body-sm font-bold text-foreground">
                      Target Audience / Recipient Scope <span className="text-destructive">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setTargetScope("all")}
                        className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                          targetScope === "all"
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-surface text-muted hover:border-border-subtle hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-display text-body-sm font-bold">
                          <span className="material-symbols-outlined text-[18px] text-primary">groups</span>
                          <span>All Students</span>
                        </div>
                        <span className="text-caption text-muted mt-1">Platform-wide broadcast</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetScope("campus")}
                        className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                          targetScope === "campus"
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-surface text-muted hover:border-border-subtle hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-display text-body-sm font-bold">
                          <span className="material-symbols-outlined text-[18px] text-primary">domain</span>
                          <span>By Campus</span>
                        </div>
                        <span className="text-caption text-muted mt-1">Target specific campus</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetScope("student")}
                        className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                          targetScope === "student"
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-surface text-muted hover:border-border-subtle hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-display text-body-sm font-bold">
                          <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                          <span>Specific Student</span>
                        </div>
                        <span className="text-caption text-muted mt-1">Direct single user</span>
                      </button>
                    </div>
                  </div>

                  {/* Campus Selector (when scope is campus) */}
                  {targetScope === "campus" && (
                    <div className="space-y-1.5 rounded-xl border border-primary/30 bg-primary/5 p-4 animate-in fade-in">
                      <label htmlFor="campus-select" className="block font-display text-body-sm font-bold text-foreground">
                        Select Campus
                      </label>
                      <select
                        id="campus-select"
                        value={selectedCampusId}
                        onChange={(e) => setSelectedCampusId(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-body text-foreground focus:border-primary focus:outline-none"
                      >
                        {campuses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Student Selector (when scope is student) */}
                  {targetScope === "student" && (
                    <div className="space-y-1.5 rounded-xl border border-primary/30 bg-primary/5 p-4 animate-in fade-in">
                      <label htmlFor="student-select" className="block font-display text-body-sm font-bold text-foreground">
                        Select Student (User ID / Phone)
                      </label>
                      <select
                        id="student-select"
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-body text-foreground focus:border-primary focus:outline-none"
                      >
                        <option value="">-- Choose a Student --</option>
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.full_name ? `${s.full_name} (${s.phone})` : s.phone} — {s.grabit_user_id || s.id.slice(0, 8)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Optional Action URL / Deep Link */}
                  <div className="space-y-1.5">
                    <label htmlFor="broadcast-action-url" className="block font-display text-body-sm font-bold text-foreground">
                      Deep Link / Action URL <span className="text-caption text-muted font-normal">(Optional)</span>
                    </label>
                    <input
                      id="broadcast-action-url"
                      type="text"
                      value={actionUrl}
                      onChange={(e) => setActionUrl(e.target.value)}
                      placeholder="/customer/notifications or /customer/menu or /customer/orders/[id]"
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-body text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Result Message */}
                  {sendResult && (
                    <div
                      className={`p-4 rounded-xl border ${
                        sendResult.ok
                          ? "bg-success/10 border-success/30 text-success"
                          : "bg-destructive/10 border-destructive/30 text-destructive"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-body-sm">
                        <span className="material-symbols-outlined text-[20px]">
                          {sendResult.ok ? "check_circle" : "error"}
                        </span>
                        <span>{sendResult.message}</span>
                      </div>
                      {sendResult.details && (
                        <div className="mt-2 text-caption flex gap-4 text-foreground/80 font-mono">
                          <span>Targeted: {sendResult.details.targeted}</span>
                          <span className="text-success">Dispatched: {sendResult.details.dispatched}</span>
                          {sendResult.details.failed > 0 && (
                            <span className="text-destructive">Failed: {sendResult.details.failed}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full rounded-xl bg-primary py-4 text-body font-display font-extrabold uppercase tracking-wider text-black shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[20px]">
                          progress_activity
                        </span>
                        <span>Sending Broadcast...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px] font-bold">
                          send
                        </span>
                        <span>Send Push Notification</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar: Live Preview & Delivery Overview */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-surface-elevated/80 p-6 backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    visibility
                  </span>
                  <h3 className="font-display text-body font-bold text-foreground">
                    Device Notification Preview
                  </h3>
                </div>

                <div className="mt-4 p-4 rounded-xl border border-border/60 bg-surface shadow-inner space-y-2">
                  <div className="flex items-center justify-between text-caption text-muted">
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span>GRABIT Student</span>
                    </div>
                    <span>Just now</span>
                  </div>
                  <h4 className="font-display text-body-sm font-bold text-foreground">
                    {title.trim() || "Notification Title"}
                  </h4>
                  <p className="text-caption text-muted leading-relaxed">
                    {message.trim() || "Message body will appear here in the system tray and in-app notification center."}
                  </p>
                  {actionUrl && (
                    <span className="inline-block text-[11px] text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">
                      Tap $\rightarrow$ {actionUrl}
                    </span>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-border space-y-3">
                  <div className="flex justify-between text-caption">
                    <span className="text-muted">Target Scope:</span>
                    <span className="font-bold text-foreground capitalize">{targetScope}</span>
                  </div>
                  <div className="flex justify-between text-caption">
                    <span className="text-muted">Estimated Recipients:</span>
                    <span className="font-bold text-primary font-mono">{estimatedTargetCount()} student(s)</span>
                  </div>
                  <div className="flex justify-between text-caption">
                    <span className="text-muted">Active FCM Devices:</span>
                    <span className="font-bold text-success font-mono">Real-time Fan-out</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BROADCAST AUDIT HISTORY */}
        {activeTab === "history" && (
          <div className="rounded-2xl border border-border bg-surface-elevated/80 p-6 backdrop-blur-md shadow-lg space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  history_toggle_off
                </span>
                <h2 className="font-display text-heading font-800 text-foreground">
                  Sent Notification Broadcasts Audit
                </h2>
              </div>
              <span className="text-caption text-muted">
                {broadcastHistory.length} total entries
              </span>
            </div>

            {broadcastHistory.length === 0 ? (
              <div className="py-16 text-center text-muted">
                <span className="material-symbols-outlined text-[48px] text-border">
                  notifications_off
                </span>
                <p className="mt-2 text-body font-semibold">No notification broadcasts logged yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50 overflow-x-auto">
                {broadcastHistory.map((item) => (
                  <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-body font-bold text-foreground">
                          {item.title}
                        </span>
                        <span className="rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 text-[10px] font-extrabold uppercase text-primary">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-body-sm text-muted">{item.message}</p>
                      {item.action_url && (
                        <span className="inline-block text-caption text-primary/80 font-mono">
                          Action: {item.action_url}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0 text-caption text-muted">
                      <div>{new Date(item.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</div>
                      <div className="font-mono">{new Date(item.created_at).toLocaleTimeString("en-IN")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SYSTEM OPERATIONAL ALERTS (EXISTING TELEMETRY) */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            {/* Status & Severity Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface-elevated/80 p-4 backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-caption font-bold uppercase tracking-wider text-muted mr-2">
                  Status:
                </span>
                {(["ALL", "OPEN", "ACKNOWLEDGED", "RESOLVED"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-xl px-3 py-1.5 text-label font-bold transition-all ${
                      statusFilter === st
                        ? "bg-primary text-black shadow-md"
                        : "bg-surface text-muted hover:text-foreground hover:bg-surface-elevated"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-caption font-bold uppercase tracking-wider text-muted mr-2">
                  Severity:
                </span>
                {(["ALL", "CRITICAL", "WARNING", "INFO"] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`rounded-xl px-3 py-1.5 text-label font-bold transition-all ${
                      severityFilter === sev
                        ? "bg-foreground text-background font-extrabold"
                        : "bg-surface text-muted hover:text-foreground hover:bg-surface-elevated"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Alerts List */}
            {loadingAlerts ? (
              <div className="flex h-64 items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-[32px] text-primary">
                  progress_activity
                </span>
              </div>
            ) : errorAlerts ? (
              <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">
                <p className="text-body font-bold">{errorAlerts}</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface-elevated/50 p-12 text-center text-muted">
                <span className="material-symbols-outlined text-[48px] text-muted">
                  task_alt
                </span>
                <h3 className="mt-2 font-display text-body font-bold text-foreground">
                  No active operational alerts found
                </h3>
                <p className="mt-1 text-caption text-muted">
                  System telemetry reports all operations are nominal.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alertItem) => {
                  const isBusy = actioningId === alertItem.id;
                  const isOpen = alertItem.status === "OPEN";
                  const isAcknowledged = alertItem.status === "ACKNOWLEDGED";
                  const isResolved = alertItem.status === "RESOLVED";

                  return (
                    <div
                      key={alertItem.id}
                      className={`rounded-2xl border p-5 backdrop-blur-md transition-all ${
                        alertItem.severity === "CRITICAL"
                          ? "border-destructive/60 bg-destructive/5"
                          : alertItem.severity === "WARNING"
                          ? "border-warning/60 bg-warning/5"
                          : "border-border bg-surface-elevated/80"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-display text-body font-bold text-foreground">
                                {alertItem.title}
                              </h3>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                  alertItem.severity === "CRITICAL"
                                    ? "bg-destructive text-white"
                                    : alertItem.severity === "WARNING"
                                    ? "bg-warning text-black"
                                    : "bg-surface-elevated text-foreground"
                                }`}
                              >
                                {alertItem.severity}
                              </span>
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
            )}
          </div>
        )}
      </div>
    </main>
  );
}
