"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuditOverviewCards } from "@/components/superadmin/audit/AuditOverviewCards";
import { AuditFilterBar } from "@/components/superadmin/audit/AuditFilterBar";
import { AuditTable } from "@/components/superadmin/audit/AuditTable";
import { AuditDetailModal } from "@/components/superadmin/audit/AuditDetailModal";
import { AuditTimelineModal } from "@/components/superadmin/audit/AuditTimelineModal";
import type {
  AuditLogEntry,
  AuditOverviewStats,
} from "@/lib/supabase/superadmin_audit";

export default function SuperAdminAuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [stats, setStats] = useState<AuditOverviewStats>({
    totalEvents: 0,
    todayEvents: 0,
    adminActions: 0,
    securityEvents: 0,
    financialActions: 0,
    vendorActions: 0,
    userActions: 0,
    criticalEvents: 0,
  });

  const [events, setEvents] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Modal State
  const [selectedEvent, setSelectedEvent] = useState<AuditLogEntry | null>(null);
  const [timelineEntity, setTimelineEntity] = useState<{ type: string; id: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (moduleFilter !== "ALL") params.set("module", moduleFilter);
      if (actionFilter !== "ALL") params.set("action", actionFilter);
      if (severityFilter !== "ALL") params.set("severity", severityFilter);
      if (dateRangeFilter !== "ALL") params.set("dateRange", dateRangeFilter);
      params.set("page", currentPage.toString());
      params.set("pageSize", pageSize.toString());

      const res = await fetch(`/api/superadmin/audit-logs?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setStats(data.stats);
        setEvents(data.events);
        setTotalCount(data.totalCount);
      } else {
        setErrorMsg(data.error || "Failed to load audit logs.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error loading audit logs.");
    } finally {
      setLoading(false);
    }
  }, [search, moduleFilter, actionFilter, severityFilter, dateRangeFilter, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time Supabase Realtime Channel listener on `superadmin_audit_logs`
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("superadmin_audit_logs_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "superadmin_audit_logs" },
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
    setModuleFilter("ALL");
    setActionFilter("ALL");
    setSeverityFilter("ALL");
    setDateRangeFilter("ALL");
    setCurrentPage(1);
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (moduleFilter !== "ALL") params.set("module", moduleFilter);
      if (actionFilter !== "ALL") params.set("action", actionFilter);
      if (severityFilter !== "ALL") params.set("severity", severityFilter);
      if (dateRangeFilter !== "ALL") params.set("dateRange", dateRangeFilter);

      const res = await fetch(`/api/superadmin/audit-logs/export?${params.toString()}`);
      if (!res.ok) {
        alert("Failed to generate CSV export.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grabit_audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("An error occurred while downloading CSV.");
    } fontFinally: {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Audit Logs & Activity Center</h1>
            <span className="bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Immutable Audit
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Centralized production security console for inspecting privileged actions across GRABIT platform
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

      {/* Error State Banner */}
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

      {/* Live Overview KPI Cards */}
      <AuditOverviewCards stats={stats} loading={loading && events.length === 0} />

      {/* Search & Filter Controls */}
      <AuditFilterBar
        search={search}
        setSearch={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        moduleFilter={moduleFilter}
        setModuleFilter={(val) => {
          setModuleFilter(val);
          setCurrentPage(1);
        }}
        actionFilter={actionFilter}
        setActionFilter={(val) => {
          setActionFilter(val);
          setCurrentPage(1);
        }}
        severityFilter={severityFilter}
        setSeverityFilter={(val) => {
          setSeverityFilter(val);
          setCurrentPage(1);
        }}
        dateRangeFilter={dateRangeFilter}
        setDateRangeFilter={(val) => {
          setDateRangeFilter(val);
          setCurrentPage(1);
        }}
        onReset={handleResetFilters}
        onExport={handleExportCsv}
        exporting={exporting}
      />

      {/* Audit Directory Table */}
      <AuditTable
        events={events}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={(page) => setCurrentPage(page)}
        onSelectEvent={(evt) => setSelectedEvent(evt)}
        onViewTimeline={(type, id) => setTimelineEntity({ type, id })}
        loading={loading}
      />

      {/* Event Detail Modal */}
      <AuditDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onViewTimeline={(type, id) => setTimelineEntity({ type, id })}
      />

      {/* Entity Activity Timeline Modal */}
      <AuditTimelineModal
        entityType={timelineEntity?.type || null}
        entityId={timelineEntity?.id || null}
        onClose={() => setTimelineEntity(null)}
      />
    </div>
  );
}
