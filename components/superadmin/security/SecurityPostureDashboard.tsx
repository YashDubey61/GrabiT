"use client";

import type { SecurityPostureData } from "@/lib/supabase/superadmin_security";

interface SecurityPostureDashboardProps {
  posture: SecurityPostureData;
}

export function SecurityPostureDashboard({ posture }: SecurityPostureDashboardProps) {
  const pillars = [
    {
      title: "Authentication Health",
      icon: "lock_clock",
      color: "text-blue-400",
      items: [
        { label: "Successful Auth Rate", value: posture.authentication.successRate },
        { label: "Failed Auth Rate", value: posture.authentication.failedRate },
        { label: "Suspicious Auth Events", value: posture.authentication.suspiciousEvents },
        { label: "Account Lockouts", value: posture.authentication.accountLockouts },
      ],
    },
    {
      title: "Privileged Access Control",
      icon: "admin_panel_settings",
      color: "text-purple-400",
      items: [
        { label: "Active Super Admins", value: posture.privilegedAccess.activeAdmins },
        { label: "Recent Admin Actions", value: posture.privilegedAccess.recentActions },
        { label: "High-Risk Admin Actions", value: posture.privilegedAccess.highRiskActions },
        { label: "Anomalous Admin Telemetry", value: posture.privilegedAccess.unusualActivity },
      ],
    },
    {
      title: "Account Security State",
      icon: "manage_accounts",
      color: "text-emerald-400",
      items: [
        { label: "Suspended Users", value: posture.accounts.suspendedUsers },
        { label: "Disabled Accounts", value: posture.accounts.disabledUsers },
        { label: "Recently Elevated Roles (30d)", value: posture.accounts.elevatedRoles30d },
        { label: "Total Role Changes (30d)", value: posture.accounts.roleChanges30d },
      ],
    },
    {
      title: "Platform Infrastructure Security",
      icon: "shield",
      color: "text-orange-400",
      items: [
        { label: "Config Changes (30d)", value: posture.platform.configChanges30d },
        { label: "Emergency Kill Switches", value: posture.platform.emergencyKillSwitches },
        { label: "Sensitive Audit Logs", value: posture.platform.sensitiveAuditEvents },
        { label: "Active Security Incidents", value: posture.platform.recentIncidents },
      ],
    },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-4 mb-6">
      <div className="flex items-center gap-2">
        <span className="material-icons text-orange-400">health_metrics</span>
        <h3 className="text-base font-bold text-white">Platform Security Posture Health Matrix</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pillars.map((pillar, idx) => (
          <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
              <span className={`material-icons text-lg ${pillar.color}`}>{pillar.icon}</span>
              <h4 className="text-xs font-bold text-zinc-200 uppercase">{pillar.title}</h4>
            </div>

            <div className="space-y-2">
              {pillar.items.map((it, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">{it.label}</span>
                  <span className="font-mono font-bold text-zinc-100">{it.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
