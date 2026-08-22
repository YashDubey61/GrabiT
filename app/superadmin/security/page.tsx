"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { SecurityOverviewCards } from "@/components/superadmin/security/SecurityOverviewCards";
import { SecurityPostureDashboard } from "@/components/superadmin/security/SecurityPostureDashboard";
import { SecurityEventTable } from "@/components/superadmin/security/SecurityEventTable";
import { SecurityEventDetailDrawer } from "@/components/superadmin/security/SecurityEventDetailDrawer";
import type {
  SecurityOverviewStats,
  SecurityPostureData,
  SecurityEventItem,
} from "@/lib/supabase/superadmin_security";

export default function SuperAdminSecurityPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [stats, setStats] = useState<SecurityOverviewStats>({
    securityScore: 100,
    securityScoreFormula: {
      baseScore: 100,
      criticalDeductions: 0,
      highRiskDeductions: 0,
      failedLoginDeductions: 0,
      suspendedAccountDeductions: 0,
    },
    criticalAlerts: 0,
    highRiskEvents: 0,
    failedLoginAttempts: 0,
    suspiciousSessions: 0,
    privilegedActions: 0,
    suspendedAccounts: 0,
    activeSuperAdmins: 0,
  });

  const [posture, setPosture] = useState<SecurityPostureData>({
    authentication: { failedRate: "0%", successRate: "100%", suspiciousEvents: 0, accountLockouts: 0 },
    privilegedAccess: { activeAdmins: 0, recentActions: 0, highRiskActions: 0, unusualActivity: "Nominal" },
    accounts: { suspendedUsers: 0, disabledUsers: 0, elevatedRoles30d: 0, roleChanges30d: 0 },
    platform: { configChanges30d: 0, emergencyKillSwitches: 0, sensitiveAuditEvents: 0, recentIncidents: 0 },
  });

  const [events, setEvents] = useState<SecurityEventItem[]>([]);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Detail Drawer State
  const [selectedEvent, setSelectedEvent] = useState<SecurityEventItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (severityFilter !== "ALL") params.set("severity", severityFilter);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);

      const res = await fetch(`/api/superadmin/security?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setStats(data.stats);
        setPosture(data.posture);
        setEvents(data.events);
      } else {
        setErrorMsg(data.error || "Failed to load security telemetry.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error loading security monitoring.");
    } finally {
      setLoading(false);
    }
  }, [search, severityFilter, categoryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Supabase Realtime listener on `superadmin_audit_logs`
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("superadmin_security_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "superadmin_audit_logs" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const handleResetFilters = () => {
    setSearch("");
    setSeverityFilter("ALL");
    setCategoryFilter("ALL");
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (severityFilter !== "ALL") params.set("severity", severityFilter);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);

      const res = await fetch(`/api/superadmin/security/export?${params.toString()}`);
      if (!res.ok) throw new Error("CSV Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grabit_security_events_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err?.message || "Failed to export security CSV report.");
    } finally {
      setExporting(false);
    }
  };

  const handleSelectEvent = (e: SecurityEventItem) => {
    setSelectedEvent(e);
    setIsDrawerOpen(true);
  };

  const handleUpdateInvestigation = async (
    eventId: string,
    status: string,
    notes?: string,
    resolutionReason?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/superadmin/security/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status, notes, resolutionReason }),
      });
      const data = await res.json();

      if (data.ok) {
        await loadData();
        return true;
      } else {
        alert(data.error || "Failed to update security investigation.");
        return false;
      }
    } catch {
      alert("Network error updating security investigation.");
      return false;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Security & Access Monitoring Center</h1>
            <span className="bg-rose-950/60 border border-rose-800/60 text-rose-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Live Security Telemetry
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Monitor platform security posture, privileged access, authentication anomalies, and security events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <span className={`material-icons text-xs ${loading ? "animate-spin" : ""}`}>refresh</span>
            Refresh
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

      {/* Overview KPI Cards + Explainable Security Score */}
      <SecurityOverviewCards stats={stats} loading={loading && events.length === 0} />

      {/* Four-Pillar Security Posture Health Matrix */}
      <SecurityPostureDashboard posture={posture} />

      {/* Filter Bar */}
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
              placeholder="Search security events by Event ID, Actor, Action, or Target..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
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
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL Only</option>
              <option value="HIGH">HIGH Severity</option>
              <option value="MEDIUM">MEDIUM Severity</option>
              <option value="LOW">LOW Severity</option>
            </select>

            <button
              onClick={handleResetFilters}
              className="px-3 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-zinc-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span className="material-icons text-xs">restart_alt</span>
              Reset
            </button>

            <button
              onClick={handleExportCsv}
              disabled={exporting}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
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
      </div>

      {/* Security Event Table */}
      <SecurityEventTable
        events={events}
        onSelectEvent={handleSelectEvent}
        loading={loading && events.length === 0}
      />

      {/* Event Investigation Drawer */}
      <SecurityEventDetailDrawer
        event={selectedEvent}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdateInvestigation={handleUpdateInvestigation}
      />
    </div>
  );
}
