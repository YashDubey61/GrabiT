"use client";

import { useState } from "react";
import Link from "next/link";
import type { SecurityEventItem } from "@/lib/supabase/superadmin_security";

interface SecurityEventDetailDrawerProps {
  event: SecurityEventItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateInvestigation: (eventId: string, status: string, notes?: string, resolutionReason?: string) => Promise<boolean>;
}

export function SecurityEventDetailDrawer({
  event,
  isOpen,
  onClose,
  onUpdateInvestigation,
}: SecurityEventDetailDrawerProps) {
  const [status, setStatus] = useState("OPEN");
  const [notes, setNotes] = useState("");
  const [resolutionReason, setResolutionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const isResolving = status === "RESOLVED" || status === "DISMISSED";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isResolving && !resolutionReason.trim()) {
      setError("A mandatory explanation reason is required when resolving or dismissing a security alert.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const success = await onUpdateInvestigation(event.id, status, notes, resolutionReason);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update security investigation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm p-0">
      <div className="bg-zinc-900 border-l border-zinc-800 max-w-2xl w-full h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/40 border border-orange-800/60 px-2.5 py-0.5 rounded">
                {event.id}
              </span>
              <span className="text-xs font-semibold text-rose-400 uppercase bg-rose-950/60 border border-rose-800 px-2 py-0.5 rounded">
                {event.severity}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{event.eventType}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Error State Banner */}
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
            <span className="material-icons text-sm text-rose-400">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Event Context */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1">
            <div className="text-[10px] uppercase font-semibold text-zinc-500">Actor Context</div>
            <div className="font-bold text-white">{event.actorName || "Super Admin"}</div>
            <div className="text-zinc-400">Role: {event.actorRole}</div>
            <div className="text-zinc-400 font-mono">IP: {event.ipAddress || "Masked"}</div>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1">
            <div className="text-[10px] uppercase font-semibold text-zinc-500">Target Entity & Module</div>
            <div className="font-bold text-white">{event.module}</div>
            <div className="text-zinc-400 font-mono">Target ID: {event.targetId || "N/A"}</div>
            <div className="text-zinc-400">Timestamp: {new Date(event.timestamp).toLocaleString()}</div>
          </div>
        </div>

        {/* Reason / Signal Explanation */}
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
          <div className="text-[10px] uppercase font-semibold text-zinc-500">Security Telemetry Signal</div>
          <p className="text-xs text-zinc-200 leading-relaxed">{event.reason || "Standard security audit log event."}</p>
        </div>

        {/* Deep Links */}
        <div className="flex items-center gap-2 flex-wrap bg-zinc-950 p-3 rounded-xl border border-zinc-800">
          <span className="text-xs font-semibold text-zinc-400 mr-2">Investigation Navigation:</span>
          {event.targetId && (
            <Link
              href={`/superadmin/risk?entityId=${event.targetId}`}
              className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded text-xs font-semibold"
            >
              Risk Center
            </Link>
          )}
          <Link
            href={`/superadmin/audit-logs?eventId=${event.id}`}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-medium"
          >
            Audit History
          </Link>
        </div>

        {/* Investigation Mutation Form */}
        <form onSubmit={handleSubmit} className="space-y-4 border-t border-zinc-800 pt-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">Investigation Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-orange-400 focus:outline-none"
            >
              <option value="OPEN">OPEN (Under Review)</option>
              <option value="INVESTIGATING">INVESTIGATING (Active Investigation)</option>
              <option value="RESOLVED">RESOLVED (Mitigated & Closed)</option>
              <option value="DISMISSED">DISMISSED (False Positive)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">Security Investigation Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add security investigation findings or notes..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none"
            />
          </div>

          {isResolving && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                Resolution Explanation <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={2}
                value={resolutionReason}
                onChange={(e) => setResolutionReason(e.target.value)}
                placeholder="Explain resolution rationale or mitigation steps taken..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none"
                required
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-md flex items-center gap-1"
            >
              {submitting && <span className="material-icons text-xs animate-spin">sync</span>}
              Save Security Investigation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
