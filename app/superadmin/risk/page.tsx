"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { RiskOverviewCards } from "@/components/superadmin/risk/RiskOverviewCards";
import { RiskFilterBar } from "@/components/superadmin/risk/RiskFilterBar";
import { RiskCaseTable } from "@/components/superadmin/risk/RiskCaseTable";
import { RiskDetailModal } from "@/components/superadmin/risk/RiskDetailModal";
import type {
  RiskCaseItem,
  RiskOverviewStats,
} from "@/lib/supabase/superadmin_risk";

export default function SuperAdminRiskPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState<RiskOverviewStats>({
    highRiskCases: 0,
    mediumRiskCases: 0,
    lowRiskCases: 0,
    openInvestigations: 0,
    resolvedCases: 0,
    suspiciousOrders: 0,
    suspiciousAccounts: 0,
    paymentAnomalies: 0,
  });
  const [cases, setCases] = useState<RiskCaseItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [riskLevelFilter, setRiskLevelFilter] = useState("all");
  const [caseStatusFilter, setCaseStatusFilter] = useState("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Modal State
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (riskLevelFilter !== "all") params.set("riskLevel", riskLevelFilter);
      if (caseStatusFilter !== "all") params.set("caseStatus", caseStatusFilter);
      if (entityTypeFilter !== "all") params.set("entityType", entityTypeFilter);
      params.set("page", currentPage.toString());
      params.set("pageSize", pageSize.toString());

      const res = await fetch(`/api/superadmin/risk?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setStats(data.stats);
        setCases(data.cases);
        setTotalCount(data.totalCount);
      }
    } catch {
      // Fail-safe default
    } finally {
      setLoading(false);
    }
  }, [search, riskLevelFilter, caseStatusFilter, entityTypeFilter, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time Supabase Postgres Sync on `superadmin_risk_cases`, `orders`, `payments`
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("superadmin_risk_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "superadmin_risk_cases" },
        () => {
          loadData();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
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
    setRiskLevelFilter("all");
    setCaseStatusFilter("all");
    setEntityTypeFilter("all");
    setCurrentPage(1);
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (riskLevelFilter !== "all") params.set("riskLevel", riskLevelFilter);
      if (caseStatusFilter !== "all") params.set("caseStatus", caseStatusFilter);
      if (entityTypeFilter !== "all") params.set("entityType", entityTypeFilter);

      const res = await fetch(`/api/superadmin/risk/export?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to generate export.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GRABIT_Risk_Report_${new Date().toISOString().split("T")[0]}.csv`;
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
              security
            </span>
            <h1 className="font-display text-display font-extrabold tracking-tight text-foreground">
              Fraud & Risk Center
            </h1>
          </div>
          <p className="font-display text-caption text-muted mt-1">
            Centralized risk monitoring, explainable risk scoring, pattern detection, and case investigations.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2 font-display text-caption font-bold text-foreground hover:border-primary/40 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          <span>Refresh Signals</span>
        </button>
      </div>

      {/* Overview Statistics Cards */}
      <RiskOverviewCards stats={stats} isLoading={loading} />

      {/* Filter & Search Bar */}
      <RiskFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        riskLevelFilter={riskLevelFilter}
        onRiskLevelChange={(val) => {
          setRiskLevelFilter(val);
          setCurrentPage(1);
        }}
        caseStatusFilter={caseStatusFilter}
        onCaseStatusChange={(val) => {
          setCaseStatusFilter(val);
          setCurrentPage(1);
        }}
        entityTypeFilter={entityTypeFilter}
        onEntityTypeChange={(val) => {
          setEntityTypeFilter(val);
          setCurrentPage(1);
        }}
        onResetFilters={handleResetFilters}
        onExportCsv={handleExportCsv}
        isExporting={exporting}
      />

      {/* Risk Case Directory Table / Mobile List */}
      <RiskCaseTable
        cases={cases}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={(p) => setCurrentPage(p)}
        onSelectCase={(c) => setSelectedCaseId(c.id)}
        isLoading={loading}
      />

      {/* Case Detail Inspection Modal */}
      {selectedCaseId && (
        <RiskDetailModal
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}
