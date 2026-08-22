"use client";

import type { SecurityEventItem } from "@/lib/supabase/superadmin_security";

interface SecurityEventTableProps {
  events: SecurityEventItem[];
  onSelectEvent: (event: SecurityEventItem) => void;
  loading?: boolean;
}

export function SecurityEventTable({ events, onSelectEvent, loading }: SecurityEventTableProps) {
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-rose-950/90 text-rose-300 border-rose-800 animate-pulse font-bold";
      case "HIGH":
        return "bg-orange-950/80 text-orange-300 border-orange-800 font-semibold";
      case "MEDIUM":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "LOW":
      case "INFO":
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-rose-950/80 text-rose-300 border-rose-800";
      case "INVESTIGATING":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "RESOLVED":
      case "DISMISSED":
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

  if (!events || events.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center shadow-md">
        <span className="material-icons text-5xl text-zinc-600 mb-3">security</span>
        <h3 className="text-lg font-semibold text-zinc-200">No Security Events Found</h3>
        <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
          No security events or anomalies match your search query or severity filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
              <th className="py-3.5 px-4">Event ID & Type</th>
              <th className="py-3.5 px-4">Severity</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Actor</th>
              <th className="py-3.5 px-4">Target ID</th>
              <th className="py-3.5 px-4">Masked IP</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Timestamp</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {events.map((e) => (
              <tr
                key={e.id}
                onClick={() => onSelectEvent(e)}
                className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-4">
                  <div className="font-mono text-orange-400 font-bold">{e.id}</div>
                  <div className="font-bold text-zinc-100 mt-0.5">{e.eventType}</div>
                </td>

                <td className="py-3 px-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase border ${getSeverityBadge(e.severity)}`}>
                    {e.severity}
                  </span>
                </td>

                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {e.category}
                  </span>
                </td>

                <td className="py-3 px-4 whitespace-nowrap font-medium text-zinc-300">{e.actorName || "System"}</td>

                <td className="py-3 px-4 whitespace-nowrap font-mono text-zinc-400">{e.targetId || "N/A"}</td>

                <td className="py-3 px-4 whitespace-nowrap font-mono text-zinc-400">{e.ipAddress || "Masked"}</td>

                <td className="py-3 px-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(e.investigationStatus)}`}>
                    {e.investigationStatus}
                  </span>
                </td>

                <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-zinc-400">
                  {new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>

                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <button
                    onClick={(evt) => {
                      evt.stopPropagation();
                      onSelectEvent(e);
                    }}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                  >
                    Investigate
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
