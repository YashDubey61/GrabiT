"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { FlagOverviewCards } from "@/components/superadmin/feature-flags/FlagOverviewCards";
import { FlagFilterBar } from "@/components/superadmin/feature-flags/FlagFilterBar";
import { FlagTable } from "@/components/superadmin/feature-flags/FlagTable";
import { FlagEditModal } from "@/components/superadmin/feature-flags/FlagEditModal";
import { FlagHistoryModal } from "@/components/superadmin/feature-flags/FlagHistoryModal";
import type {
  FeatureFlagItem,
  FlagOverviewStats,
} from "@/lib/supabase/superadmin_feature_flags";

export default function SuperAdminFeatureFlagsPage() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [stats, setStats] = useState<FlagOverviewStats>({
    totalFlags: 0,
    enabled: 0,
    disabled: 0,
    scheduled: 0,
    gradualRollouts: 0,
    recentlyChanged: 0,
    productionFlags: 0,
    experimentalFlags: 0,
  });

  const [flags, setFlags] = useState<FeatureFlagItem[]>([]);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [envFilter, setEnvFilter] = useState("ALL");

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlagItem | null>(null);
  const [historyFlag, setHistoryFlag] = useState<FeatureFlagItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (envFilter !== "ALL") params.set("environment", envFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/superadmin/feature-flags?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setStats(data.stats);
        setFlags(data.flags);
      } else {
        setErrorMsg(data.error || "Failed to load feature flags.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error loading feature flags.");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, envFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time Supabase listener on `superadmin_feature_flags`
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("superadmin_feature_flags_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "superadmin_feature_flags" },
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
    setCategoryFilter("ALL");
    setStatusFilter("ALL");
    setEnvFilter("ALL");
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (envFilter !== "ALL") params.set("environment", envFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/superadmin/feature-flags/export?${params.toString()}`);
      if (!res.ok) throw new Error("CSV Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grabit_feature_flags_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err?.message || "Failed to export feature flags CSV report.");
    } finally {
      setExporting(false);
    }
  };

  const handleCreateFlagTrigger = () => {
    setSelectedFlag(null);
    setIsEditModalOpen(true);
  };

  const handleSelectFlagTrigger = (flag: FeatureFlagItem) => {
    setSelectedFlag(flag);
    setIsEditModalOpen(true);
  };

  const handleSaveFlag = async (flagData: Partial<FeatureFlagItem>, reason: string): Promise<boolean> => {
    try {
      if (selectedFlag) {
        // Edit existing flag
        const res = await fetch("/api/superadmin/feature-flags", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flagKey: selectedFlag.key,
            updates: flagData,
            reason,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          await loadData();
          return true;
        } else {
          alert(`Error saving flag: ${data.error}`);
          return false;
        }
      } else {
        // Create new flag
        const res = await fetch("/api/superadmin/feature-flags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(flagData),
        });
        const data = await res.json();
        if (data.ok) {
          await loadData();
          return true;
        } else {
          alert(`Error creating flag: ${data.error}`);
          return false;
        }
      }
    } catch {
      alert("Network error while saving feature flag.");
      return false;
    }
  };

  const handleKillSwitch = async (flagKey: string, reason: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/superadmin/feature-flags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flagKey,
          isKillSwitch: true,
          reason,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await loadData();
        return true;
      } else {
        alert(`Emergency Kill Switch error: ${data.error}`);
        return false;
      }
    } catch {
      alert("Network error executing Emergency Kill Switch.");
      return false;
    }
  };

  const handleRollbackFlag = async (flagKey: string, targetState: any, reason: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/superadmin/feature-flags/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagKey, targetState, reason }),
      });
      const data = await res.json();
      if (data.ok) {
        await loadData();
        return true;
      } else {
        alert(`Rollback error: ${data.error}`);
        return false;
      }
    } catch {
      alert("Network error executing rollback.");
      return false;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Feature Flags & Controlled Rollouts</h1>
            <span className="bg-orange-950/60 border border-orange-800/60 text-orange-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              Live Deployment Control
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Safely enable, disable, target, and gradually roll out platform features without redeploying code
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
      <FlagOverviewCards stats={stats} loading={loading && flags.length === 0} />

      {/* Filter Bar */}
      <FlagFilterBar
        search={search}
        setSearch={setSearch}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        envFilter={envFilter}
        setEnvFilter={setEnvFilter}
        onReset={handleResetFilters}
        onCreateFlag={handleCreateFlagTrigger}
        onExport={handleExportCsv}
        exporting={exporting}
      />

      {/* Feature Flags Directory Table / Cards */}
      <FlagTable
        flags={flags}
        onSelectFlag={handleSelectFlagTrigger}
        onViewHistory={(f) => setHistoryFlag(f)}
        onKillSwitch={(f) => {
          const reasonPrompt = prompt(`EMERGENCY KILL SWITCH: Enter reason to immediately disable '${f.key}' in production:`);
          if (reasonPrompt && reasonPrompt.trim()) {
            handleKillSwitch(f.key, reasonPrompt);
          }
        }}
        loading={loading && flags.length === 0}
      />

      {/* Edit / Create Modal */}
      <FlagEditModal
        flag={selectedFlag}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveFlag}
        onKillSwitch={handleKillSwitch}
      />

      {/* History & Rollback Modal */}
      <FlagHistoryModal
        flag={historyFlag}
        onClose={() => setHistoryFlag(null)}
        onRollback={handleRollbackFlag}
      />
    </div>
  );
}
