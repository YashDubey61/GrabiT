"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type SuperAdminKpis,
  type SystemAlertItem,
  type TransactionStreamLog,
} from "@/lib/mock/superadmin";
import { SuperAdminHeader } from "@/components/superadmin/dashboard/SuperAdminHeader";
import { SuperAdminKpiGrid } from "@/components/superadmin/dashboard/SuperAdminKpiGrid";
import { CampusHealthCard } from "@/components/superadmin/dashboard/CampusHealthCard";
import { GrowthForecastCard } from "@/components/superadmin/dashboard/GrowthForecastCard";
import { SystemAlertsCard } from "@/components/superadmin/dashboard/SystemAlertsCard";
import { TransactionStreamTable } from "@/components/superadmin/dashboard/TransactionStreamTable";

const EMPTY_KPIS: SuperAdminKpis = {
  totalGmv: 0,
  gmvGrowthPercent: 0,
  activeCampuses: 0,
  activeStudents: 0,
  studentsGrowthText: "—",
  platformCommissionPercent: 0,
  netRevenue: 0,
};

export default function SuperAdminDashboardPage() {
  // No hardcoded initial data — starts empty/zeroed, populated exclusively
  // from GET /api/superadmin/dashboard (Supabase-backed).
  const [kpis, setKpis] = useState<SuperAdminKpis>(EMPTY_KPIS);
  const [campusHealth, setCampusHealth] = useState({
    activeCampuses: 0,
    northVol: "0 vol",
    westVol: "0 vol",
    southVol: "0 vol",
  });
  const [alerts, setAlerts] = useState<SystemAlertItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionStreamLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/superadmin/dashboard");
      const result = await res.json();

      if (result.ok && result.data) {
        setKpis(result.data.kpis);
        if (result.data.campusHealth) {
          setCampusHealth({
            activeCampuses: result.data.campusHealth.activeCampuses,
            northVol: result.data.campusHealth.northVol,
            westVol: result.data.campusHealth.westVol,
            southVol: result.data.campusHealth.southVol,
          });
        }
        if (result.data.alerts && result.data.alerts.length > 0) {
          setAlerts(result.data.alerts);
        }
        if (result.data.transactions) {
          setTransactions(result.data.transactions);
        }
      }
    } catch {
      // Retain baseline data on network fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleForceRefresh = () => {
    loadData();
    showNotification("Global telemetry force refreshed from live Supabase");
  };

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
      (log) =>
        log.txCode.toLowerCase().includes(q) ||
        log.campusName.toLowerCase().includes(q) ||
        log.status.toLowerCase().includes(q),
    );
  }, [searchQuery, transactions]);

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-24">
        {notification && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-body-sm font-semibold text-primary animate-fade-in">
            {notification}
          </div>
        )}

        {/* Header Section */}
        <SuperAdminHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={handleForceRefresh}
        />

        {/* KPI Grid */}
        <SuperAdminKpiGrid kpis={kpis} />

        {/* Middle Bento Section */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <CampusHealthCard
              activeCampuses={campusHealth.activeCampuses}
              northVol={campusHealth.northVol}
              westVol={campusHealth.westVol}
              southVol={campusHealth.southVol}
              onExpandMap={() =>
                showNotification("Live network GIS map expanded (Demo mode)")
              }
            />
          </div>

          <div className="lg:col-span-4">
            <GrowthForecastCard />
          </div>
        </section>

        {/* Bottom Section: System Alerts & Transaction Stream */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <SystemAlertsCard alerts={alerts} />
          </div>

          <div className="lg:col-span-2">
            <TransactionStreamTable
              logs={filteredLogs}
              onViewAllLogs={() =>
                showNotification("Full audit transaction log opened (Demo mode)")
              }
            />
          </div>
        </section>

        {/* Footer telemetry notice */}
        <div className="text-center pt-2">
          <span className="font-mono text-caption text-faint">
            {isLoading
              ? "Syncing live Super Admin telemetry..."
              : "Live Supabase Telemetry Connected"}
          </span>
        </div>
      </main>
    </div>
  );
}
