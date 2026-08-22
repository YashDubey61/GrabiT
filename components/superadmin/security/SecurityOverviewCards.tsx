"use client";

import type { SecurityOverviewStats } from "@/lib/supabase/superadmin_security";

interface SecurityOverviewCardsProps {
  stats: SecurityOverviewStats;
  loading?: boolean;
}

export function SecurityOverviewCards({ stats, loading }: SecurityOverviewCardsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 bg-emerald-950/30 border-emerald-800";
    if (score >= 75) return "text-amber-400 bg-amber-950/30 border-amber-800";
    return "text-rose-400 bg-rose-950/30 border-rose-800";
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-24 rounded-xl bg-zinc-900/60 border border-zinc-800 animate-pulse p-4" />
        ))}
      </div>
    );
  }

  const { securityScoreFormula: f } = stats;

  return (
    <div className="space-y-4 mb-6">
      {/* Top Security Score Banner */}
      <div className={`p-5 rounded-2xl border ${getScoreColor(stats.securityScore)} shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-icons text-2xl">verified_user</span>
            <h2 className="text-lg font-bold text-white">Platform Security Score Posture</h2>
          </div>
          <p className="text-xs text-zinc-300">
            Explainable formula: Base (100) - Critical ({f.criticalDeductions}) - High Risk ({f.highRiskDeductions}) - Auth Anomalies ({f.failedLoginDeductions}) - Suspensions ({f.suspendedAccountDeductions})
          </p>
        </div>

        <div className="flex items-baseline gap-1 bg-black/40 px-4 py-2 rounded-xl border border-white/10 self-start sm:self-auto">
          <span className="text-3xl font-mono font-extrabold text-white">{stats.securityScore}</span>
          <span className="text-xs font-mono text-zinc-400">/ 100</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Alerts */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-lg border-l-4 border-l-rose-500 text-rose-400">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-zinc-400">
            <span>Critical Alerts</span>
            <span className="material-icons text-base text-rose-400">gpp_maybe</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.criticalAlerts}</div>
          <p className="mt-1 text-[11px] text-zinc-400">Require immediate investigation</p>
        </div>

        {/* High Risk Events */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-lg border-l-4 border-l-orange-500 text-orange-400">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-zinc-400">
            <span>High Risk Events</span>
            <span className="material-icons text-base text-orange-400">warning</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.highRiskEvents}</div>
          <p className="mt-1 text-[11px] text-zinc-400">Elevated security signals</p>
        </div>

        {/* Failed Logins & Sessions */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-lg border-l-4 border-l-amber-500 text-amber-400">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-zinc-400">
            <span>Auth & Sessions</span>
            <span className="material-icons text-base text-amber-400">fingerprint</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.failedLoginAttempts}</div>
          <p className="mt-1 text-[11px] text-zinc-400">{stats.suspiciousSessions} Suspicious Session</p>
        </div>

        {/* Privileged Actions & Super Admins */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-lg border-l-4 border-l-blue-500 text-blue-400">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-zinc-400">
            <span>Privileged Access</span>
            <span className="material-icons text-base text-blue-400">admin_panel_settings</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.privilegedActions}</div>
          <p className="mt-1 text-[11px] text-zinc-400">{stats.activeSuperAdmins} Active Super Admins</p>
        </div>
      </div>
    </div>
  );
}
