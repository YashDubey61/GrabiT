"use client";

import { useState } from "react";
import type {
  SuperAdminIncidentItem,
  IncidentTimelineEvent,
  IncidentPostmortem,
  IncidentStatus,
  IncidentSeverity,
} from "@/lib/supabase/superadmin_incidents";

interface IncidentCommandDrawerProps {
  incident: SuperAdminIncidentItem | null;
  events: IncidentTimelineEvent[];
  postmortem: IncidentPostmortem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (payload: {
    incidentId: string;
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    resolution?: string;
    internalNotes?: string;
  }) => Promise<boolean>;
  onAddEvent: (incidentId: string, message: string, eventType?: string) => Promise<boolean>;
  onSavePostmortem: (payload: {
    incidentId: string;
    rootCause: string;
    impactSummary: string;
    timelineSummary: string;
    whatWentWell?: string;
    whatWentWrong?: string;
    correctiveActions?: string;
    preventiveActions?: string;
    status?: "DRAFT" | "IN_REVIEW" | "APPROVED";
  }) => Promise<boolean>;
}

export function IncidentCommandDrawer({
  incident,
  events,
  postmortem,
  isOpen,
  onClose,
  onUpdateStatus,
  onAddEvent,
  onSavePostmortem,
}: IncidentCommandDrawerProps) {
  const [activeTab, setActiveTab] = useState<"workspace" | "postmortem">("workspace");

  // Workspace Form State
  const [status, setStatus] = useState<IncidentStatus>("INVESTIGATING");
  const [severity, setSeverity] = useState<IncidentSeverity>("SEV2");
  const [resolution, setResolution] = useState("");
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Postmortem Form State
  const [pmRootCause, setPmRootCause] = useState("");
  const [pmImpactSummary, setPmImpactSummary] = useState("");
  const [pmTimelineSummary, setPmTimelineSummary] = useState("");
  const [pmCorrectiveActions, setPmCorrectiveActions] = useState("");

  if (!isOpen || !incident) return null;

  const isResolving = status === "RESOLVED" && (severity === "SEV1" || severity === "SEV2");
  const isClosing = status === "CLOSED" && (severity === "SEV1" || severity === "SEV2");

  const handleUpdateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isResolving && !resolution.trim() && !incident.resolution) {
      setError(`Resolving a ${severity} incident strictly requires a mandatory resolution rationale.`);
      return;
    }
    if (isClosing && !postmortem) {
      setError(`Closing a ${severity} incident strictly requires a completed postmortem report.`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const success = await onUpdateStatus({
        incidentId: incident.id,
        status,
        severity,
        resolution: resolution.trim() || undefined,
      });

      if (newNote.trim()) {
        await onAddEvent(incident.id, newNote.trim(), "NOTE");
        setNewNote("");
      }

      if (success) onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update incident.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePostmortemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const success = await onSavePostmortem({
        incidentId: incident.id,
        rootCause: pmRootCause || postmortem?.rootCause || "Detailed root cause analysis",
        impactSummary: pmImpactSummary || postmortem?.impactSummary || "Impact summary analysis",
        timelineSummary: pmTimelineSummary || postmortem?.timelineSummary || "Chronological timeline summary",
        correctiveActions: pmCorrectiveActions || postmortem?.correctiveActions,
        status: "APPROVED",
      });
      if (success) {
        alert("Postmortem report saved successfully.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save postmortem.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm p-0">
      <div className="bg-zinc-900 border-l border-zinc-800 max-w-3xl w-full h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/40 border border-orange-800/60 px-2.5 py-0.5 rounded">
                {incident.incidentNumber}
              </span>
              <span className="text-xs font-bold text-rose-400 uppercase bg-rose-950/60 border border-rose-800 px-2 py-0.5 rounded">
                {incident.severity}
              </span>
              <span className="text-xs font-bold text-emerald-400 uppercase bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                {incident.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{incident.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("workspace")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "workspace" ? "bg-orange-600 text-white" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              Workspace
            </button>
            <button
              onClick={() => setActiveTab("postmortem")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "postmortem" ? "bg-orange-600 text-white" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              Postmortem {postmortem ? "✅" : "📝"}
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-white p-2 rounded-lg">
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
            <span className="material-icons text-sm text-rose-400">error</span>
            <span>{error}</span>
          </div>
        )}

        {activeTab === "workspace" ? (
          <>
            {/* Impact Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-0.5">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Affected Users</div>
                <div className="font-bold text-white font-mono">{incident.affectedUserCount}</div>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-0.5">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Affected Orders</div>
                <div className="font-bold text-white font-mono">{incident.affectedOrderCount}</div>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-0.5">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Failed Payments</div>
                <div className="font-bold text-rose-400 font-mono">{incident.affectedPaymentCount}</div>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-0.5">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Revenue Impact</div>
                <div className="font-bold text-purple-400 font-mono">₹{incident.estimatedRevenueImpact}</div>
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
              <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Chronological Timeline Stream</div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {events.map((evt) => (
                  <div key={evt.id} className="p-2.5 bg-zinc-900 border border-zinc-800/80 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span className="font-mono text-orange-400 font-bold">{evt.eventType}</span>
                      <span>{new Date(evt.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-zinc-200">{evt.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Command Action Form */}
            <form onSubmit={handleUpdateIncident} className="space-y-4 border-t border-zinc-800 pt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-300 uppercase mb-1">Status Lifecycle</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as IncidentStatus)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-orange-400 font-bold focus:outline-none"
                  >
                    <option value="DETECTED">DETECTED</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="MITIGATING">MITIGATING</option>
                    <option value="MONITORING">MONITORING</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 uppercase mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-rose-400 font-bold focus:outline-none"
                  >
                    <option value="SEV1">SEV1</option>
                    <option value="SEV2">SEV2</option>
                    <option value="SEV3">SEV3</option>
                    <option value="SEV4">SEV4</option>
                  </select>
                </div>
              </div>

              {isResolving && (
                <div>
                  <label className="block font-semibold text-zinc-300 uppercase mb-1">
                    Resolution Rationale <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Provide resolution explanation rationale..."
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-zinc-300 uppercase mb-1">Add Timeline Note</label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add operational investigation update note..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-1"
                >
                  {submitting && <span className="material-icons text-xs animate-spin">sync</span>}
                  Save Command Update
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Postmortem Tab */
          <form onSubmit={handleSavePostmortemSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-zinc-300 uppercase mb-1">Root Cause *</label>
              <textarea
                rows={2}
                value={pmRootCause || postmortem?.rootCause || ""}
                onChange={(e) => setPmRootCause(e.target.value)}
                placeholder="Explain exact root cause..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 uppercase mb-1">Impact Summary *</label>
              <textarea
                rows={2}
                value={pmImpactSummary || postmortem?.impactSummary || ""}
                onChange={(e) => setPmImpactSummary(e.target.value)}
                placeholder="Summary of student, vendor, and revenue impact..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 uppercase mb-1">Timeline Summary *</label>
              <textarea
                rows={2}
                value={pmTimelineSummary || postmortem?.timelineSummary || ""}
                onChange={(e) => setPmTimelineSummary(e.target.value)}
                placeholder="Chronological timeline summary..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 uppercase mb-1">Corrective Actions</label>
              <textarea
                rows={2}
                value={pmCorrectiveActions || postmortem?.correctiveActions || ""}
                onChange={(e) => setPmCorrectiveActions(e.target.value)}
                placeholder="Action items to prevent recurrence..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
              >
                Approve & Save Postmortem
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
