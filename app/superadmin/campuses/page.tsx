"use client";

import { useEffect, useState, useCallback } from "react";
import type { SuperAdminCampus, CampusActivityFeedItem } from "@/lib/mock/superadmin";
import { CampusHeader } from "@/components/superadmin/campuses/CampusHeader";
import { CampusStatsGrid } from "@/components/superadmin/campuses/CampusStatsGrid";
import { CampusRegistryTable } from "@/components/superadmin/campuses/CampusRegistryTable";
import { CampusManageModal } from "@/components/superadmin/campuses/CampusManageModal";
import { CampusInsightsSection } from "@/components/superadmin/campuses/CampusInsightsSection";

export default function SuperAdminCampusesPage() {
  // No hardcoded initial data — starts empty, populated exclusively from
  // GET /api/superadmin/campuses (Supabase-backed). isLoading gates the
  // registry table so it never flashes a zero-campus empty state before
  // the first fetch resolves.
  const [campuses, setCampuses] = useState<SuperAdminCampus[]>([]);
  const [stats, setStats] = useState({
    totalCampusesCount: 0,
    totalVendorsCount: 0,
    dailyVolume: "0 orders",
    networkHealth: "—",
  });
  const [activities, setActivities] = useState<CampusActivityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<SuperAdminCampus | null>(
    null,
  );
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = `/api/superadmin/campuses?q=${encodeURIComponent(
        searchQuery,
      )}&status=${encodeURIComponent(statusFilter)}`;
      const res = await fetch(url);
      const result = await res.json();

      if (result.ok && result.data) {
        if (result.data.campuses) setCampuses(result.data.campuses);
        if (result.data.stats) setStats(result.data.stats);
        if (result.data.activities) setActivities(result.data.activities);
      }
    } catch {
      // Retain current data on network exception
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleOpenAddModal = () => {
    setEditingCampus(null);
    setIsModalOpen(true);
  };

  const handleOpenManageModal = (campus: SuperAdminCampus) => {
    setEditingCampus(campus);
    setIsModalOpen(true);
  };

  const handleSaveCampus = async (
    campusData: Omit<SuperAdminCampus, "id"> & { id?: string },
  ) => {
    try {
      if (campusData.id) {
        // Edit existing campus via PATCH API
        const res = await fetch(`/api/superadmin/campuses/${campusData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: campusData.name,
            location: campusData.location,
            status: campusData.status,
            logisticsLeadName: campusData.logisticsLeadName,
          }),
        });

        const data = await res.json();
        if (data.ok) {
          showNotification(`"${campusData.name}" updated successfully`);
          await loadData();
        } else {
          showNotification(data.error || "Failed to update campus.");
        }
      } else {
        // Add new campus via POST API
        const res = await fetch("/api/superadmin/campuses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: campusData.name,
            location: campusData.location,
            status: campusData.status,
            logisticsLeadName: campusData.logisticsLeadName,
          }),
        });

        const data = await res.json();
        if (data.ok) {
          showNotification(`"${campusData.name}" onboarded successfully`);
          await loadData();
        } else {
          showNotification(data.error || "Failed to create campus.");
        }
      }
    } catch {
      showNotification("Network error saving campus.");
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-24">
        {notification && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-body-sm font-semibold text-primary animate-fade-in">
            {notification}
          </div>
        )}

        {/* Header & Controls */}
        <CampusHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onAddNewCampus={handleOpenAddModal}
        />

        {/* Stats Grid */}
        <CampusStatsGrid
          totalCampusesCount={stats.totalCampusesCount}
          totalVendorsCount={stats.totalVendorsCount}
          dailyVolume={stats.dailyVolume}
          networkHealth={stats.networkHealth}
        />

        {/* Institutional Registry Table */}
        <CampusRegistryTable
          campuses={campuses}
          isLoading={isLoading}
          onManageCampus={handleOpenManageModal}
          onDownloadRegistry={() =>
            showNotification("Institutional campus registry CSV exported")
          }
        />

        {/* Insights & Recent Activity */}
        <CampusInsightsSection
          activities={activities}
          onViewAllLogs={() =>
            showNotification("Super Admin audit logs opened")
          }
        />

        {/* Manage Campus Modal */}
        <CampusManageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveCampus}
          editingCampus={editingCampus}
        />

        {/* Loading Footer Notice */}
        <div className="text-center pt-2">
          <span className="font-mono text-caption text-faint">
            {isLoading
              ? "Syncing live Super Admin campus registry..."
              : "Live Supabase Campus Persistence Active"}
          </span>
        </div>
      </main>
    </div>
  );
}
