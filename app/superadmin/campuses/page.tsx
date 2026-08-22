"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CampusOverviewCards } from "@/components/superadmin/campuses/CampusOverviewCards";
import { CampusFilterBar } from "@/components/superadmin/campuses/CampusFilterBar";
import { CampusComparisonModal } from "@/components/superadmin/campuses/CampusComparisonModal";
import { CampusManageModal } from "@/components/superadmin/campuses/CampusManageModal";
import type {
  CampusDirectoryItem,
  CampusOverviewStats,
} from "@/lib/supabase/superadmin_campuses";

export default function SuperAdminCampusesPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [stats, setStats] = useState<CampusOverviewStats>({
    totalCampuses: 0,
    activeCampuses: 0,
    inactiveCampuses: 0,
    totalStudents: 0,
    totalVendors: 0,
    activeVendors: 0,
    todaysOrders: 0,
    todaysGmv: 0,
  });

  const [campuses, setCampuses] = useState<CampusDirectoryItem[]>([]);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/superadmin/campuses?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setStats(data.stats);
        setCampuses(data.campuses);
      } else {
        setErrorMsg(data.error || "Failed to load campus directory.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error loading campus directory.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time Supabase listener on `campuses`, `canteens`, `orders`
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("superadmin_campuses_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campuses" },
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
    setStatusFilter("ALL");
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/superadmin/campuses/export?${params.toString()}`);
      if (!res.ok) throw new Error("CSV Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grabit_campus_report_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err?.message || "Failed to export campus CSV report.");
    } finally {
      setExporting(false);
    }
  };

  const handleSaveCampus = async (campusData: any) => {
    try {
      const res = await fetch("/api/superadmin/campuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campusData),
      });
      const data = await res.json();

      if (data.ok) {
        await loadData();
        setIsManageModalOpen(false);
      } else {
        alert(data.error || "Failed to create campus.");
      }
    } catch {
      alert("Network error onboarding new campus.");
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Campus-Level Control Center</h1>
            <span className="bg-orange-950/60 border border-orange-800/60 text-orange-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              Institutional Management
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Monitor, manage, onboard, and compare institutional university campuses across the GRABIT network
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

      {/* Overview KPI Cards */}
      <CampusOverviewCards stats={stats} loading={loading && campuses.length === 0} />

      {/* Filter Bar */}
      <CampusFilterBar
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onReset={handleResetFilters}
        onCompare={() => setIsCompareOpen(true)}
        onExport={handleExportCsv}
        onAddNewCampus={() => setIsManageModalOpen(true)}
        exporting={exporting}
      />

      {/* Campus Directory Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        {loading && campuses.length === 0 ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-zinc-950/60 border border-zinc-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : campuses.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <span className="material-icons text-5xl text-zinc-600 mb-3">school</span>
            <h3 className="text-lg font-semibold text-zinc-200">No Institutional Campuses Found</h3>
            <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
              No campuses match your search query or status filters. Try clearing your search or onboarding a new campus.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
                  <th className="py-3.5 px-4">Campus Name & ID</th>
                  <th className="py-3.5 px-4">Location / City</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Students</th>
                  <th className="py-3.5 px-4 text-right">Vendors</th>
                  <th className="py-3.5 px-4 text-right">Today's Orders</th>
                  <th className="py-3.5 px-4 text-right">Today's GMV</th>
                  <th className="py-3.5 px-4">Logistics Lead</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {campuses.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/40 transition-colors group">
                    <td className="py-3 px-4">
                      <Link href={`/superadmin/campuses/${c.id}`} className="font-bold text-zinc-100 hover:text-orange-400">
                        {c.name}
                      </Link>
                      <div className="font-mono text-[11px] text-zinc-500 mt-0.5">{c.id}</div>
                    </td>

                    <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">{c.location}</td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                          c.status === "ACTIVE"
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-zinc-200 font-semibold">
                      {c.studentsCount.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-purple-300 font-semibold">
                      {c.activeVendorsCount} / {c.vendorsCount}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-zinc-200 font-bold">
                      {c.todaysOrders.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                      ₹{c.todaysGmv.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">
                      {c.logisticsLeadName || "Operations Lead"}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <Link
                        href={`/superadmin/campuses/${c.id}`}
                        className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-semibold transition-colors shadow-sm inline-block"
                      >
                        Control Console
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      <CampusComparisonModal isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} />

      {/* Add New Campus Modal */}
      <CampusManageModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        onSave={handleSaveCampus}
        editingCampus={null}
      />
    </div>
  );
}
