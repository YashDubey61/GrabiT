"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { VendorApplicationOverviewCards } from "@/components/superadmin/vendors/applications/VendorApplicationOverviewCards";
import { VendorApplicationFilterBar } from "@/components/superadmin/vendors/applications/VendorApplicationFilterBar";
import { VendorApplicationTable } from "@/components/superadmin/vendors/applications/VendorApplicationTable";
import { VendorApplicationDetailModal } from "@/components/superadmin/vendors/applications/VendorApplicationDetailModal";
import type {
  VendorApplicationItem,
  VendorApplicationStats,
} from "@/lib/supabase/superadmin_vendor_applications";

export default function SuperAdminVendorApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VendorApplicationStats>({
    totalApplications: 0,
    pendingReview: 0,
    approvedVendors: 0,
    rejectedApplications: 0,
    suspendedVendors: 0,
    kycPending: 0,
    kycVerified: 0,
  });
  const [applications, setApplications] = useState<VendorApplicationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("all");
  const [kycStatusFilter, setKycStatusFilter] = useState("all");
  const [vendorStatusFilter, setVendorStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Modal State
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (appStatusFilter !== "all") params.set("applicationStatus", appStatusFilter);
      if (kycStatusFilter !== "all") params.set("kycStatus", kycStatusFilter);
      if (vendorStatusFilter !== "all") params.set("vendorStatus", vendorStatusFilter);
      params.set("page", currentPage.toString());
      params.set("pageSize", pageSize.toString());

      const res = await fetch(`/api/superadmin/vendors/applications?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setStats(data.stats);
        setApplications(data.applications);
        setTotalCount(data.totalCount);
      }
    } catch {
      // Fail-safe default
    } finally {
      setLoading(false);
    }
  }, [search, appStatusFilter, kycStatusFilter, vendorStatusFilter, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time Supabase Postgres Sync on `vendor_applications` and `canteens`
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("superadmin_vendor_apps_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vendor_applications" },
        () => {
          loadData();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "canteens" },
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
    setAppStatusFilter("all");
    setKycStatusFilter("all");
    setVendorStatusFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[28px]">
              verified
            </span>
            <h1 className="font-display text-display font-extrabold tracking-tight text-foreground">
              Vendor Approval & KYC
            </h1>
          </div>
          <p className="font-display text-caption text-muted mt-1">
            Review vendor applications, verify KYC compliance, manage onboarding queues, and enforce vendor suspensions.
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
      <VendorApplicationOverviewCards stats={stats} isLoading={loading} />

      {/* Filter & Search Bar */}
      <VendorApplicationFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        appStatusFilter={appStatusFilter}
        onAppStatusChange={(val) => {
          setAppStatusFilter(val);
          setCurrentPage(1);
        }}
        kycStatusFilter={kycStatusFilter}
        onKycStatusChange={(val) => {
          setKycStatusFilter(val);
          setCurrentPage(1);
        }}
        vendorStatusFilter={vendorStatusFilter}
        onVendorStatusChange={(val) => {
          setVendorStatusFilter(val);
          setCurrentPage(1);
        }}
        onResetFilters={handleResetFilters}
      />

      {/* Application Directory Table / Mobile List */}
      <VendorApplicationTable
        applications={applications}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={(p) => setCurrentPage(p)}
        onSelectApplication={(app) => setSelectedAppId(app.id)}
        isLoading={loading}
      />

      {/* Detail Review Modal */}
      {selectedAppId && (
        <VendorApplicationDetailModal
          applicationId={selectedAppId}
          onClose={() => setSelectedAppId(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
}
