"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { SupportOverviewCards } from "@/components/superadmin/support/SupportOverviewCards";
import { SupportQueueTabs } from "@/components/superadmin/support/SupportQueueTabs";
import { SupportFilterBar } from "@/components/superadmin/support/SupportFilterBar";
import { SupportTicketTable } from "@/components/superadmin/support/SupportTicketTable";
import { SupportTicketWorkspaceDrawer } from "@/components/superadmin/support/SupportTicketWorkspaceDrawer";
import type {
  SupportTicketItem,
  SupportOverviewStats,
  SupportQueue,
} from "@/lib/supabase/superadmin_support";

export default function SuperAdminSupportPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [stats, setStats] = useState<SupportOverviewStats>({
    openTickets: 0,
    unassignedTickets: 0,
    highPriority: 0,
    criticalIssues: 0,
    waitingForCustomer: 0,
    waitingForVendor: 0,
    resolvedToday: 0,
    avgResolutionTimeMins: 0,
  });

  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);

  // Queue & Filter State
  const [selectedQueue, setSelectedQueue] = useState<SupportQueue>("ALL");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Workspace Drawer State
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      params.set("queue", selectedQueue);
      if (search.trim()) params.set("search", search.trim());
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);

      const res = await fetch(`/api/superadmin/support?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setStats(data.stats);
        setTickets(data.tickets);
      } else {
        setErrorMsg(data.error || "Failed to load support tickets.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error loading support tickets.");
    } finally {
      setLoading(false);
    }
  }, [selectedQueue, search, priorityFilter, statusFilter, categoryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time Supabase listener on `support_tickets`
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("superadmin_support_tickets_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Compute Queue Counts
  const queueCounts = useMemo(() => {
    return {
      ALL: tickets.length,
      UNASSIGNED: tickets.filter((t) => !t.assignedAdminId && t.status !== "RESOLVED" && t.status !== "CLOSED").length,
      MY_TICKETS: tickets.filter((t) => Boolean(t.assignedAdminId)).length,
      HIGH_PRIORITY: tickets.filter((t) => t.priority === "HIGH" || t.priority === "CRITICAL").length,
      CRITICAL: tickets.filter((t) => t.priority === "CRITICAL").length,
      WAITING_FOR_CUSTOMER: tickets.filter((t) => t.status === "WAITING_FOR_CUSTOMER").length,
      WAITING_FOR_VENDOR: tickets.filter((t) => t.status === "WAITING_FOR_VENDOR").length,
      SLA_BREACHED: tickets.filter((t) => t.slaStatus === "BREACHED").length,
      RESOLVED: tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length,
    };
  }, [tickets]);

  const handleResetFilters = () => {
    setSearch("");
    setPriorityFilter("ALL");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      params.set("queue", selectedQueue);
      if (search.trim()) params.set("search", search.trim());
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);

      const res = await fetch(`/api/superadmin/support/export?${params.toString()}`);
      if (!res.ok) throw new Error("CSV Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grabit_support_tickets_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err?.message || "Failed to export support CSV report.");
    } finally {
      setExporting(false);
    }
  };

  const handleSelectTicket = (t: SupportTicketItem) => {
    setSelectedTicket(t);
    setIsWorkspaceOpen(true);
  };

  const handleTicketAction = async (action: string, payload?: any, reason?: string): Promise<boolean> => {
    if (!selectedTicket) return false;

    try {
      const res = await fetch(`/api/superadmin/support/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload, reason }),
      });
      const data = await res.json();

      if (data.ok) {
        await loadData();
        return true;
      } else {
        alert(data.error || "Failed to execute support action.");
        return false;
      }
    } catch {
      alert("Network error executing support action.");
      return false;
    }
  };

  const handleSendMessage = async (message: string, messageType: "CUSTOMER_MESSAGE" | "INTERNAL_NOTE"): Promise<boolean> => {
    if (!selectedTicket) return false;

    try {
      const res = await fetch(`/api/superadmin/support/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, messageType }),
      });
      const data = await res.json();

      if (data.ok) {
        await loadData();
        return true;
      } else {
        alert(data.error || "Failed to post message.");
        return false;
      }
    } catch {
      alert("Network error posting message.");
      return false;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Customer Support & Operations Center</h1>
            <span className="bg-orange-950/60 border border-orange-800/60 text-orange-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              Live Operations Helpdesk
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Centralized support console to investigate issues, manage tickets, track SLAs, and resolve customer queries
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

      {/* Overview KPI Cards */}
      <SupportOverviewCards stats={stats} loading={loading && tickets.length === 0} />

      {/* Queue Tabs */}
      <SupportQueueTabs
        selectedQueue={selectedQueue}
        onSelectQueue={setSelectedQueue}
        queueCounts={queueCounts}
      />

      {/* Filter Bar */}
      <SupportFilterBar
        search={search}
        setSearch={setSearch}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        onReset={handleResetFilters}
        onExport={handleExportCsv}
        exporting={exporting}
      />

      {/* Ticket Table */}
      <SupportTicketTable
        tickets={tickets}
        onSelectTicket={handleSelectTicket}
        loading={loading && tickets.length === 0}
      />

      {/* Ticket Workspace Drawer */}
      <SupportTicketWorkspaceDrawer
        ticket={selectedTicket}
        isOpen={isWorkspaceOpen}
        onClose={() => setIsWorkspaceOpen(false)}
        onTicketAction={handleTicketAction}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
