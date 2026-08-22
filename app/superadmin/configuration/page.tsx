"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { ConfigOverviewCards } from "@/components/superadmin/configuration/ConfigOverviewCards";
import { ConfigCategoryNav } from "@/components/superadmin/configuration/ConfigCategoryNav";
import { ConfigFilterBar } from "@/components/superadmin/configuration/ConfigFilterBar";
import { ConfigItemCard } from "@/components/superadmin/configuration/ConfigItemCard";
import { ConfigEditModal } from "@/components/superadmin/configuration/ConfigEditModal";
import { ConfigHistoryModal } from "@/components/superadmin/configuration/ConfigHistoryModal";
import type {
  PlatformConfigItem,
  ConfigOverviewStats,
} from "@/lib/supabase/superadmin_configuration";

export default function SuperAdminConfigurationPage() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [stats, setStats] = useState<ConfigOverviewStats>({
    activeConfigs: 0,
    recentlyUpdated: 0,
    pendingChanges: 0,
    categoriesCount: 0,
    lastUpdatedBy: "Super Admin",
    lastUpdatedAt: new Date().toISOString(),
  });

  const [configurations, setConfigurations] = useState<PlatformConfigItem[]>([]);

  // Navigation & Filter State
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isHighImpactOnly, setIsHighImpactOnly] = useState(false);

  // Modal State
  const [editingItem, setEditingItem] = useState<PlatformConfigItem | null>(null);
  const [historyItem, setHistoryItem] = useState<PlatformConfigItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);
      if (search.trim()) params.set("search", search.trim());
      if (isHighImpactOnly) params.set("isHighImpact", "true");

      const res = await fetch(`/api/superadmin/configuration?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setStats(data.stats);
        setConfigurations(data.configurations);
      } else {
        setErrorMsg(data.error || "Failed to load platform configuration.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error loading platform configuration.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search, isHighImpactOnly]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time Supabase channel listener on `platform_settings`
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("superadmin_platform_settings_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "platform_settings" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Category counts computation for category navigation badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    configurations.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return counts;
  }, [configurations]);

  const handleResetFilters = () => {
    setSelectedCategory("ALL");
    setSearch("");
    setIsHighImpactOnly(false);
  };

  const handleSaveSetting = async (key: string, newValue: any, reason: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/superadmin/configuration", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configKey: key, newValue, reason }),
      });
      const data = await res.json();

      if (data.ok) {
        await loadData();
        return true;
      } else {
        alert(`Error saving setting: ${data.error}`);
        return false;
      }
    } catch {
      alert("Network error while saving setting.");
      return false;
    }
  };

  const handleRollbackSetting = async (key: string, targetValue: any, reason: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/superadmin/configuration/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configKey: key, targetValue, reason }),
      });
      const data = await res.json();

      if (data.ok) {
        await loadData();
        return true;
      } else {
        alert(`Error executing rollback: ${data.error}`);
        return false;
      }
    } catch {
      alert("Network error while executing rollback.");
      return false;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Platform Configuration Control Center</h1>
            <span className="bg-orange-950/60 border border-orange-800/60 text-orange-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              High Privilege Control
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Centralized business rules, commission structures, settlement windows, and platform parameters
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
      <ConfigOverviewCards stats={stats} loading={loading && configurations.length === 0} />

      {/* Search & Filter Controls */}
      <ConfigFilterBar
        search={search}
        setSearch={setSearch}
        isHighImpactOnly={isHighImpactOnly}
        setIsHighImpactOnly={setIsHighImpactOnly}
        onReset={handleResetFilters}
      />

      {/* Main Grid: Left Category Navigation + Right Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Category Navigation */}
        <div className="lg:col-span-1">
          <ConfigCategoryNav
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
          />
        </div>

        {/* Configurations Items Display */}
        <div className="lg:col-span-3">
          {loading && configurations.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-44 bg-zinc-900/60 border border-zinc-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : configurations.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center shadow-md">
              <span className="material-icons text-5xl text-zinc-600 mb-3">display_settings</span>
              <h3 className="text-lg font-semibold text-zinc-200">No Configuration Settings Found</h3>
              <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
                No business rules match your selected category or search criteria. Try adjusting your category selection or resetting filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {configurations.map((item) => (
                <ConfigItemCard
                  key={item.key}
                  item={item}
                  onEdit={(cfg) => setEditingItem(cfg)}
                  onViewHistory={(cfg) => setHistoryItem(cfg)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Config Modal */}
      <ConfigEditModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveSetting}
      />

      {/* History & Rollback Modal */}
      <ConfigHistoryModal
        item={historyItem}
        onClose={() => setHistoryItem(null)}
        onRollback={handleRollbackSetting}
      />
    </div>
  );
}
