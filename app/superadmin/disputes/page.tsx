"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { DisputeOverviewCards } from "@/components/superadmin/disputes/DisputeOverviewCards";
import { DisputeFilterBar } from "@/components/superadmin/disputes/DisputeFilterBar";
import { DisputeTable } from "@/components/superadmin/disputes/DisputeTable";
import { DisputeDetailModal } from "@/components/superadmin/disputes/DisputeDetailModal";
import type {
  DisputeItem,
  DisputeOverviewStats,
} from "@/lib/supabase/superadmin_disputes";

export default function SuperAdminDisputesPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState<DisputeOverviewStats>({
    openDisputes: 0,
    pendingReview: 0,
    highPriority: 0,
    refundRequested: 0,
    refundApproved: 0,
    refundCompleted: 0,
    resolvedDisputes: 0,
    totalRefundAmount: 0,
  });
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [disputeTypeFilter, setDisputeTypeFilter] = useState("all");
  const [refundStatusFilter, setRefundStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Modal State
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (disputeTypeFilter !== "all") params.set("disputeType", disputeTypeFilter);
      if (refundStatusFilter !== "all") params.set("refundStatus", refundStatusFilter);
      params.set("page", currentPage.toString());
      params.set("pageSize", pageSize.toString());

      const res = await fetch(`/api/superadmin/disputes?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setStats(data.stats);
        setDisputes(data.disputes);
        setTotalCount(data.totalCount);
      }
    } catch {
      // Fail-safe default
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, disputeTypeFilter, refundStatusFilter, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time Supabase Postgres Sync on `superadmin_disputes` and `orders`
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("superadmin_disputes_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "superadmin_disputes" },
        () => {
          loadData();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => {
          loadData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setDisputeTypeFilter("all");
    setRefundStatusFilter("all");
    setCurrentPage(1);
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (disputeTypeFilter !== "all") params.set("disputeType", disputeTypeFilter);
      if (refundStatusFilter !== "all") params.set("refundStatus", refundStatusFilter);

      const res = await fetch(`/api/superadmin/disputes/export?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to generate export.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GRABIT_Dispute_Report_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      // Fail-safe feedback
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[28px]">
              support_agent
            </span>
            <h1 className="font-display text-display font-extrabold tracking-tight text-foreground">
              Dispute & Refund Center
            </h1>
          </div>
          <p className="font-display text-caption text-muted mt-1">
            Centralized dispute management, order issue investigation, refund safety, and customer settlement workflows.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2 font-display text-caption font-bold text-foreground hover:border-primary/40 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Overview Statistics Cards */}
      <DisputeOverviewCards stats={stats} isLoading={loading} />

      {/* Filter & Search Bar */}
      <DisputeFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val);
          setCurrentPage(1);
        }}
        priorityFilter={priorityFilter}
        onPriorityChange={(val) => {
          setPriorityFilter(val);
          setCurrentPage(1);
        }}
        disputeTypeFilter={disputeTypeFilter}
        onDisputeTypeChange={(val) => {
          setDisputeTypeFilter(val);
          setCurrentPage(1);
        }}
        refundStatusFilter={refundStatusFilter}
        onRefundStatusChange={(val) => {
          setRefundStatusFilter(val);
          setCurrentPage(1);
        }}
        onResetFilters={handleResetFilters}
        onExportCsv={handleExportCsv}
        isExporting={exporting}
      />

      {/* Dispute Directory Table / Mobile List */}
      <DisputeTable
        disputes={disputes}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={(p) => setCurrentPage(p)}
        onSelectDispute={(d) => setSelectedDisputeId(d.id)}
        isLoading={loading}
      />

      {/* Case Detail Inspection Modal */}
      {selectedDisputeId && (
        <DisputeDetailModal
          disputeId={selectedDisputeId}
          onClose={() => setSelectedDisputeId(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}
