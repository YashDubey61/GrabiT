"use client";

import type { SuperAdminIncidentItem } from "@/lib/supabase/superadmin_incidents";

interface IncidentTableProps {
  incidents: SuperAdminIncidentItem[];
  onSelectIncident: (incident: SuperAdminIncidentItem) => void;
  loading?: boolean;
}

export function IncidentTable({ incidents, onSelectIncident, loading }: IncidentTableProps) {
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "SEV1":
        return "bg-rose-950/90 text-rose-300 border-rose-800 animate-pulse font-bold";
      case "SEV2":
        return "bg-orange-950/80 text-orange-300 border-orange-800 font-semibold";
      case "SEV3":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "SEV4":
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DETECTED":
        return "bg-rose-950/80 text-rose-300 border-rose-800";
      case "INVESTIGATING":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "MITIGATING":
      case "MONITORING":
        return "bg-blue-950/80 text-blue-300 border-blue-800";
      case "RESOLVED":
      case "CLOSED":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md space-y-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="h-12 bg-zinc-950/60 border border-zinc-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!incidents || incidents.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center shadow-md">
        <span className="material-icons text-5xl text-zinc-600 mb-3">check_circle</span>
        <h3 className="text-lg font-semibold text-zinc-200">No Active Platform Incidents</h3>
        <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
          No platform incidents match your search query or selected severity filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
              <th className="py-3.5 px-4">Incident # & Title</th>
              <th className="py-3.5 px-4">Severity</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Affected Service</th>
              <th className="py-3.5 px-4">Impact Scope</th>
              <th className="py-3.5 px-4">Commander</th>
              <th className="py-3.5 px-4 text-right">Detected</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {incidents.map((inc) => (
              <tr
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-4">
                  <div className="font-mono text-orange-400 font-bold">{inc.incidentNumber}</div>
                  <div className="font-bold text-zinc-100 mt-0.5">{inc.title}</div>
                </td>

                <td className="py-3 px-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase border ${getSeverityBadge(inc.severity)}`}>
                    {inc.severity}
                  </span>
                </td>

                <td className="py-3 px-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(inc.status)}`}>
                    {inc.status}
                  </span>
                </td>

                <td className="py-3 px-4 whitespace-nowrap font-medium text-zinc-300">{inc.affectedService}</td>

                <td className="py-3 px-4 whitespace-nowrap font-mono text-zinc-400">
                  {inc.affectedUserCount} Users | {inc.affectedOrderCount} Orders
                </td>

                <td className="py-3 px-4 whitespace-nowrap text-zinc-300">{inc.commanderName || "Super Admin Ops"}</td>

                <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-zinc-400">
                  {new Date(inc.detectedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>

                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectIncident(inc);
                    }}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                  >
                    Command Center
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
