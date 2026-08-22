"use client";

import type { AuditLogEntry, AuditSeverity } from "@/lib/supabase/superadmin_audit";

interface AuditTableProps {
  events: AuditLogEntry[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectEvent: (event: AuditLogEntry) => void;
  onViewTimeline: (entityType: string, entityId: string) => void;
  loading?: boolean;
}

export function AuditTable({
  events,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onSelectEvent,
  onViewTimeline,
  loading,
}: AuditTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const getSeverityBadge = (severity: AuditSeverity) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-950/60 text-rose-400 border-rose-800/60";
      case "HIGH":
        return "bg-orange-950/60 text-orange-400 border-orange-800/60";
      case "MEDIUM":
        return "bg-amber-950/60 text-amber-400 border-amber-800/60";
      case "LOW":
        return "bg-emerald-950/60 text-emerald-400 border-emerald-800/60";
      case "INFO":
      default:
        return "bg-zinc-800/80 text-zinc-300 border-zinc-700/60";
    }
  };

  const getModuleBadge = (module: string) => {
    switch (module) {
      case "Users":
        return "bg-indigo-950/40 text-indigo-300 border-indigo-800/40";
      case "Vendors":
        return "bg-amber-950/40 text-amber-300 border-amber-800/40";
      case "Risk":
        return "bg-rose-950/40 text-rose-300 border-rose-800/40";
      case "Disputes":
        return "bg-orange-950/40 text-orange-300 border-orange-800/40";
      case "Finance":
      case "Payments":
        return "bg-teal-950/40 text-teal-300 border-teal-800/40";
      case "Security":
        return "bg-purple-950/40 text-purple-300 border-purple-800/40";
      default:
        return "bg-zinc-800/40 text-zinc-400 border-zinc-700/40";
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const date = new Date(ts);
      const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
      return { timeStr, dateStr };
    } catch {
      return { timeStr: ts, dateStr: "" };
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-12 bg-zinc-950/60 border border-zinc-800/80 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center shadow-md">
        <span className="material-icons text-5xl text-zinc-600 mb-3">manage_search</span>
        <h3 className="text-lg font-semibold text-zinc-200">No Audit Events Found</h3>
        <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
          No privileged actions match your current search query or applied filters. Try adjusting your filters or resetting search parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">Timestamp</th>
              <th className="py-3.5 px-4">Actor / Admin</th>
              <th className="py-3.5 px-4">Action</th>
              <th className="py-3.5 px-4">Module</th>
              <th className="py-3.5 px-4">Target Type</th>
              <th className="py-3.5 px-4">Target ID</th>
              <th className="py-3.5 px-4">Severity</th>
              <th className="py-3.5 px-4">Description / Reason</th>
              <th className="py-3.5 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {events.map((event) => {
              const { timeStr, dateStr } = formatTimestamp(event.createdAt);
              return (
                <tr
                  key={event.id}
                  className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectEvent(event)}
                >
                  {/* Timestamp */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-mono text-zinc-200 font-medium">{timeStr}</div>
                    <div className="text-[10px] text-zinc-500">{dateStr}</div>
                  </td>

                  {/* Actor */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-medium text-zinc-200">{event.actorName}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{event.actorEmail || event.actorAdminId}</div>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono text-xs text-orange-400 font-semibold bg-orange-950/30 px-2 py-0.5 rounded border border-orange-800/40">
                      {event.action}
                    </span>
                  </td>

                  {/* Module */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getModuleBadge(event.module)}`}>
                      {event.module}
                    </span>
                  </td>

                  {/* Target Type */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono text-[11px] text-zinc-300 uppercase">
                      {event.targetType}
                    </span>
                  </td>

                  {/* Target ID */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewTimeline(event.targetType, event.targetId);
                      }}
                      className="font-mono text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
                      title="Click to view entity timeline"
                    >
                      {event.targetId || "N/A"}
                    </button>
                  </td>

                  {/* Severity */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide uppercase ${getSeverityBadge(event.severity)}`}>
                      {event.severity}
                    </span>
                  </td>

                  {/* Description */}
                  <td className="py-3 px-4 max-w-xs truncate text-zinc-300">
                    {event.reason || (event.metadata ? JSON.stringify(event.metadata) : "Privileged action logged")}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(event);
                      }}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Activity Cards View */}
      <div className="block md:hidden divide-y divide-zinc-800">
        {events.map((event) => {
          const { timeStr, dateStr } = formatTimestamp(event.createdAt);
          return (
            <div
              key={event.id}
              onClick={() => onSelectEvent(event)}
              className="p-4 hover:bg-zinc-800/30 transition-colors space-y-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getSeverityBadge(event.severity)}`}>
                    {event.severity}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getModuleBadge(event.module)}`}>
                    {event.module}
                  </span>
                </div>
                <div className="text-right font-mono text-xs text-zinc-400">
                  {timeStr} <span className="text-[10px] text-zinc-600">{dateStr}</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-mono font-semibold text-orange-400">{event.action}</div>
                <div className="text-xs text-zinc-200 mt-1">{event.reason || "Privileged action recorded"}</div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
                <div>
                  <span className="text-zinc-500">Actor:</span> {event.actorName}
                </div>
                <div>
                  <span className="text-zinc-500">Target:</span>{" "}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewTimeline(event.targetType, event.targetId);
                    }}
                    className="font-mono text-blue-400 underline"
                  >
                    {event.targetId}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      <div className="bg-zinc-950/80 px-4 py-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
        <div>
          Showing <span className="font-semibold text-white">{events.length}</span> of{" "}
          <span className="font-semibold text-white">{totalCount}</span> events
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 text-zinc-300 rounded font-medium transition-colors"
          >
            Previous
          </button>
          <span className="font-mono text-zinc-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 text-zinc-300 rounded font-medium transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
