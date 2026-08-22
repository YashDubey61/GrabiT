"use client";

import type { AuditLogEntry } from "@/lib/supabase/superadmin_audit";

interface AuditDetailModalProps {
  event: AuditLogEntry | null;
  onClose: () => void;
  onViewTimeline: (entityType: string, entityId: string) => void;
}

export function AuditDetailModal({ event, onClose, onViewTimeline }: AuditDetailModalProps) {
  if (!event) return null;

  const previousState = event.previousState || {};
  const newState = event.newState || {};

  const allKeys = Array.from(
    new Set([...Object.keys(previousState), ...Object.keys(newState)])
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-orange-400 bg-orange-950/40 border border-orange-800/60 px-2 py-0.5 rounded font-semibold">
                {event.action}
              </span>
              <span className="text-xs font-mono text-zinc-400">ID: {event.id}</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Audit Event Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Primary Event Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs">
          <div>
            <div className="text-zinc-500 uppercase text-[10px] font-semibold">Timestamp</div>
            <div className="text-zinc-200 font-mono mt-0.5">
              {new Date(event.createdAt).toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-zinc-500 uppercase text-[10px] font-semibold">Actor / Admin</div>
            <div className="text-zinc-200 font-medium mt-0.5">{event.actorName}</div>
            <div className="text-[10px] text-zinc-400 font-mono">{event.actorEmail || event.actorAdminId}</div>
          </div>

          <div>
            <div className="text-zinc-500 uppercase text-[10px] font-semibold">Module / Target</div>
            <div className="text-zinc-200 font-medium mt-0.5">{event.module}</div>
            <div className="text-[10px] text-blue-400 font-mono mt-0.5">
              {event.targetType}: {event.targetId}
            </div>
          </div>

          <div>
            <div className="text-zinc-500 uppercase text-[10px] font-semibold">Severity</div>
            <div className="mt-0.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border uppercase bg-zinc-800 text-orange-400 border-orange-800">
                {event.severity}
              </span>
            </div>
          </div>
        </div>

        {/* Reason / Short Description */}
        <div>
          <h4 className="text-xs uppercase text-zinc-400 font-semibold mb-1">Reason / Context</h4>
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs text-zinc-200 font-mono">
            {event.reason || "No explicit reason specified for this action."}
          </div>
        </div>

        {/* BEFORE / AFTER Comparison View */}
        {allKeys.length > 0 && (
          <div>
            <h4 className="text-xs uppercase text-zinc-400 font-semibold mb-2">State Transition Comparison</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* BEFORE */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span className="material-icons text-xs">history</span> BEFORE
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  {allKeys.map((key) => {
                    const prevVal = previousState[key];
                    const nextVal = newState[key];
                    const isChanged = prevVal !== nextVal;
                    return (
                      <div
                        key={key}
                        className={`p-1.5 rounded flex justify-between gap-2 ${
                          isChanged ? "bg-rose-950/40 text-rose-200 border border-rose-900/60" : "text-zinc-400"
                        }`}
                      >
                        <span className="font-semibold text-zinc-400">{key}:</span>
                        <span className="truncate max-w-[180px]">
                          {prevVal !== undefined ? JSON.stringify(prevVal) : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AFTER */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span className="material-icons text-xs">update</span> AFTER
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  {allKeys.map((key) => {
                    const prevVal = previousState[key];
                    const nextVal = newState[key];
                    const isChanged = prevVal !== nextVal;
                    return (
                      <div
                        key={key}
                        className={`p-1.5 rounded flex justify-between gap-2 ${
                          isChanged ? "bg-emerald-950/40 text-emerald-200 border border-emerald-900/60" : "text-zinc-400"
                        }`}
                      >
                        <span className="font-semibold text-zinc-400">{key}:</span>
                        <span className="truncate max-w-[180px]">
                          {nextVal !== undefined ? JSON.stringify(nextVal) : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metadata & Client Network Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Metadata */}
          <div>
            <h4 className="text-xs uppercase text-zinc-400 font-semibold mb-1">Metadata Payload</h4>
            <pre className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-[11px] text-zinc-300 font-mono overflow-x-auto max-h-36">
              {event.metadata && Object.keys(event.metadata).length > 0
                ? JSON.stringify(event.metadata, null, 2)
                : "No metadata attached."}
            </pre>
          </div>

          {/* Network Info */}
          <div>
            <h4 className="text-xs uppercase text-zinc-400 font-semibold mb-1">Client Device & IP</h4>
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs space-y-2 font-mono text-zinc-300">
              <div>
                <span className="text-zinc-500">IP Address:</span> {event.ipAddress || "127.0.0.1"}
              </div>
              <div className="truncate">
                <span className="text-zinc-500">User Agent:</span> {event.userAgent || "GRABIT SuperAdmin Console"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          <button
            onClick={() => {
              onClose();
              onViewTimeline(event.targetType, event.targetId);
            }}
            className="px-4 py-2 bg-blue-900/50 hover:bg-blue-800/60 border border-blue-700/60 text-blue-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span className="material-icons text-xs">timeline</span>
            View Entity Timeline ({event.targetId})
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
