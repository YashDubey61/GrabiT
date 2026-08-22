"use client";

import { useEffect, useState } from "react";
import type { AuditLogEntry } from "@/lib/supabase/superadmin_audit";

interface AuditTimelineModalProps {
  entityType: string | null;
  entityId: string | null;
  onClose: () => void;
}

export function AuditTimelineModal({ entityType, entityId, onClose }: AuditTimelineModalProps) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    if (!entityId) return;

    let isMounted = true;
    async function loadTimeline() {
      try {
        setLoading(true);
        const res = await fetch(`/api/superadmin/audit-logs/timeline?entityType=${entityType}&entityId=${entityId}`);
        const data = await res.json();
        if (isMounted && data.ok) {
          setEvents(data.events);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTimeline();
    return () => {
      isMounted = false;
    };
  }, [entityType, entityId]);

  if (!entityId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <span className="text-xs font-mono text-blue-400 bg-blue-950/40 border border-blue-800/60 px-2 py-0.5 rounded font-semibold uppercase">
              {entityType || "ENTITY"} TIMELINE
            </span>
            <h2 className="text-xl font-bold text-white mt-1">
              Activity History for <span className="font-mono text-orange-400">{entityId}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Timeline Content */}
        {loading ? (
          <div className="space-y-4 py-8">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-16 bg-zinc-950/60 border border-zinc-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            <span className="material-icons text-4xl text-zinc-600 mb-2">event_busy</span>
            <p className="text-sm">No historical audit timeline found for {entityId}.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
            {events.map((event, idx) => {
              const dt = new Date(event.createdAt);
              return (
                <div key={event.id || idx} className="relative group">
                  {/* Timeline Bullet Dot */}
                  <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-orange-500 ring-4 ring-zinc-900 border border-orange-300" />

                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2 hover:border-zinc-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-orange-400">
                        {event.action}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {dt.toLocaleTimeString()} — {dt.toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-200">
                      {event.reason || "Action performed"}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-900">
                      <div>
                        <span className="text-zinc-500">Actor:</span> {event.actorName} ({event.actorRole})
                      </div>
                      <span className="font-mono text-[10px] text-zinc-500 uppercase">
                        Severity: {event.severity}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end border-t border-zinc-800 pt-4">
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
