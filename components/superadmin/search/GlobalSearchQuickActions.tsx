"use client";

import Link from "next/link";

export function GlobalSearchQuickActions() {
  const actions = [
    { label: "User & Role Management", href: "/superadmin/users", icon: "manage_accounts", color: "text-blue-400 bg-blue-950/30" },
    { label: "Vendor Approval & KYC", href: "/superadmin/vendors/applications", icon: "verified", color: "text-emerald-400 bg-emerald-950/30" },
    { label: "Campus Control Center", href: "/superadmin/campuses", icon: "school", color: "text-purple-400 bg-purple-950/30" },
    { label: "Fraud & Risk Center", href: "/superadmin/risk", icon: "security", color: "text-rose-400 bg-rose-950/30" },
    { label: "Dispute & Refund Center", href: "/superadmin/disputes", icon: "support_agent", color: "text-orange-400 bg-orange-950/30" },
    { label: "Customer Support Center", href: "/superadmin/support", icon: "headset_mic", color: "text-amber-400 bg-amber-950/30" },
    { label: "Audit Logs & Activity", href: "/superadmin/audit-logs", icon: "receipt_long", color: "text-zinc-300 bg-zinc-800/40" },
    { label: "Platform Configuration", href: "/superadmin/configuration", icon: "settings", color: "text-indigo-400 bg-indigo-950/30" },
    { label: "Feature Flags & Rollouts", href: "/superadmin/feature-flags", icon: "flag", color: "text-orange-400 bg-orange-950/30" },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-4">
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quick Module Navigation Shortcuts</h3>
        <p className="text-xs text-zinc-400 mt-0.5">Jump directly to specialized Super Admin operational consoles</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((act, idx) => (
          <Link
            key={idx}
            href={act.href}
            className="p-3 bg-zinc-950 hover:bg-zinc-800/60 border border-zinc-800/80 rounded-xl flex items-center gap-3 transition-colors group"
          >
            <div className={`p-2 rounded-lg ${act.color}`}>
              <span className="material-symbols-outlined text-base">{act.icon}</span>
            </div>
            <span className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
              {act.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
