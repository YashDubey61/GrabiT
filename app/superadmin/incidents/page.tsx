"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { IncidentOverviewCards } from "@/components/superadmin/incidents/IncidentOverviewCards";
import { IncidentTable } from "@/components/superadmin/incidents/IncidentTable";
import { CreateIncidentModal } from "@/components/superadmin/incidents/CreateIncidentModal";
import { IncidentCommandDrawer } from "@/components/superadmin/incidents/IncidentCommandDrawer";
import { IncidentSignalsPanel } from "@/components/superadmin/incidents/IncidentSignalsPanel";
import type {
  IncidentOverviewStats,
  SuperAdminIncidentItem,
  IncidentTimelineEvent,
  IncidentPostmortem,
  IncidentSignalItem,
  IncidentStatus,
  IncidentSeverity,
} from "@/lib/supabase/superadmin_incidents";

export default function SuperAdminIncidentsPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [stats, setStats] = useState<IncidentOverviewStats>({
    activeIncidents: 0,
    sev1Count: 0,
    sev2Count: 0,
    investigatingCount: 0,
    mitigatingCount: 0,
    resolvedTodayCount: 0,
    avgMttaMinutes: 0,
    avgMttrMinutes: 0,
  });

  const [incidents, setIncidents] = useState<SuperAdminIncidentItem[]>([]);
  const [signals, setSignals] = useState<IncidentSignalItem[]>([]);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal & Drawer State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<SuperAdminIncidentItem | null>(null);
  const [incidentEvents, setIncidentEvents] = useState<IncidentTimelineEvent[]>([]);
  const [incidentPostmortem, setIncidentPostmortem] = useState<IncidentPostmortem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (severityFilter !== "ALL") params.set("severity", severityFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const [resIncidents, resSignals] = await Promise.all([
        fetch(`/api/superadmin/incidents?${params.toString()}`),
        fetch(`/api/superadmin/incidents/signals`),
      ]);

      const dataIncidents = await resIncidents.json();
      const dataSignals = await resSignals.json();

      if (dataIncidents.ok) {
        setStats(dataIncidents.stats);
        setIncidents(dataIncidents.incidents);
      } else {
        setErrorMsg(dataIncidents.error || "Failed to load incident directory.");
      }

      if (dataSignals.ok) {
        setSignals(dataSignals.signals);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error loading incident data.");
    } finally {
      setLoading(false);
    }
  }, [search, severityFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Supabase Realtime channel listener
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("superadmin_incidents_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "superadmin_incidents" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const handleSelectIncident = async (inc: SuperAdminIncidentItem) => {
    setSelectedIncident(inc);
    setIsDrawerOpen(true);

    try {
      const res = await fetch(`/api/superadmin/incidents/${inc.id}`);
      const data = await res.json();
      if (data.ok) {
        setSelectedIncident(data.incident);
        setIncidentEvents(data.events);
        setIncidentPostmortem(data.postmortem);
      }
    } catch {
      // Fallback
    }
  };

  const handleCreateIncident = async (payload: {
    title: string;
    description: string;
    severity: IncidentSeverity;
    category: string;
    affectedService: string;
    customerImpact?: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch("/api/superadmin/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok) {
        await loadData();
        return true;
      } else {
        alert(data.error || "Failed to create incident.");
        return false;
      }
    } catch {
      alert("Network error creating incident.");
      return false;
    }
  };

  const handleUpdateStatus = async (payload: {
    incidentId: string;
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    resolution?: string;
    internalNotes?: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch(`/api/superadmin/incidents/${payload.incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok) {
        await loadData();
        return true;
      } else {
        alert(data.error || "Failed to update incident.");
        return false;
      }
    } catch {
      alert("Network error updating incident.");
      return false;
    }
  };

  const handleAddEvent = async (incidentId: string, message: string, eventType?: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/superadmin/incidents/${incidentId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, message }),
      });
      const data = await res.json();

      if (data.ok) {
        if (selectedIncident) handleSelectIncident(selectedIncident);
        return true;
      } else {
        alert(data.error || "Failed to add timeline note.");
        return false;
      }
    } catch {
      alert("Network error adding timeline note.");
      return false;
    }
  };

  const handleSavePostmortem = async (payload: {
    incidentId: string;
    rootCause: string;
    impactSummary: string;
    timelineSummary: string;
    whatWentWell?: string;
    whatWentWrong?: string;
    correctiveActions?: string;
    preventiveActions?: string;
    status?: "DRAFT" | "IN_REVIEW" | "APPROVED";
  }): Promise<boolean> => {
    try {
      const res = await fetch(`/api/superadmin/incidents/${payload.incidentId}/postmortem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok) {
        if (selectedIncident) handleSelectIncident(selectedIncident);
        return true;
      } else {
        alert(data.error || "Failed to save postmortem.");
        return false;
      }
    } catch {
      alert("Network error saving postmortem.");
      return false;
    }
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (severityFilter !== "ALL") params.set("severity", severityFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/superadmin/incidents/export?${params.toString()}`);
      if (!res.ok) throw new Error("CSV Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grabit_incidents_report_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err?.message || "Failed to export incident CSV report.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Incident Management & Operations Command</h1>
            <span className="bg-rose-950/60 border border-rose-800/60 text-rose-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Live Incident Command
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Detect, triage, investigate, mitigate, resolve, and document platform operational incidents
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-md flex items-center gap-1.5"
          >
            <span className="material-icons text-xs">add_alert</span>
            Declare Incident
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
      <IncidentOverviewCards stats={stats} loading={loading && incidents.length === 0} />

      {/* Automated Telemetry Signals Panel */}
      <IncidentSignalsPanel
        signals={signals}
        onDeclareFromSignal={(sig) => {
          setIsCreateModalOpen(true);
        }}
      />

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
              placeholder="Search incidents by Incident #, Title, Category, or Service..."
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
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="SEV1">SEV1 Critical</option>
              <option value="SEV2">SEV2 High</option>
              <option value="SEV3">SEV3 Moderate</option>
              <option value="SEV4">SEV4 Minor</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="DETECTED">DETECTED</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="MITIGATING">MITIGATING</option>
              <option value="MONITORING">MONITORING</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>

            <button
              onClick={() => {
                setSearch("");
                setSeverityFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="px-3 py-2 border border-zinc-800 bg-zinc-950 text-zinc-300 text-xs font-medium rounded-lg"
            >
              Reset
            </button>

            <button
              onClick={handleExportCsv}
              disabled={exporting}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center gap-1.5"
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

      {/* Incident Directory Table */}
      <IncidentTable
        incidents={incidents}
        onSelectIncident={handleSelectIncident}
        loading={loading && incidents.length === 0}
      />

      {/* Create Incident Modal */}
      <CreateIncidentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateIncident={handleCreateIncident}
      />

      {/* Incident Command Workspace Drawer */}
      <IncidentCommandDrawer
        incident={selectedIncident}
        events={incidentEvents}
        postmortem={incidentPostmortem}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        onAddEvent={handleAddEvent}
        onSavePostmortem={handleSavePostmortem}
      />
    </div>
  );
}
