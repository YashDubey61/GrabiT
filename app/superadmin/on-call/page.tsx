"use client";

import { useEffect, useState } from "react";
import type {
  OnCallTelemetrySummary,
} from "@/lib/incidents/sla_engine";
import type { OperationalIncident } from "@/lib/incidents/incident_service";

export default function SuperAdminOnCallPage() {
  const [telemetry, setTelemetry] = useState<OnCallTelemetrySummary | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<OperationalIncident | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [resolutionInput, setResolutionInput] = useState<string>("");
  const [showResolveModal, setShowResolveModal] = useState<OperationalIncident | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchOnCallData = async () => {
    try {
      const res = await fetch("/api/superadmin/on-call");
      if (res.ok) {
        const json: OnCallTelemetrySummary = await res.json();
        setTelemetry(json);
      }
    } catch (err) {
      console.error("Failed to load on-call dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOnCallData();
  }, []);

  const handleAction = async (
    incidentId: string,
    action: "ACKNOWLEDGE" | "START_WORK" | "ESCALATE" | "RESOLVE" | "CLOSE",
    resolutionNotes?: string,
  ) => {
    if (actioningId) return;
    setActioningId(incidentId);

    try {
      const res = await fetch(`/api/superadmin/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, resolutionNotes }),
      });

      if (res.ok) {
        showToast(
          action === "ACKNOWLEDGE"
            ? "Incident Acknowledged"
            : action === "START_WORK"
            ? "Started Work (IN_PROGRESS)"
            : action === "ESCALATE"
            ? "Incident Escalated"
            : action === "CLOSE"
            ? "Incident Case Closed"
            : "Incident Resolved",
        );
        setShowResolveModal(null);
        setResolutionInput("");
        fetchOnCallData();
      } else {
        const errJson = await res.json();
        showToast(`Action Failed: ${errJson.error || "Illegal transition"}`);
      }
    } catch (err) {
      console.error("Failed to execute incident action:", err);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6 pb-24">
      {toastMsg && (
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/10 text-center text-body-sm font-semibold text-primary animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase mb-1">
            <span className="material-symbols-outlined text-sm">emergency</span>
            Real-Time SLA &amp; Escalation Operations
          </div>
          <h1 className="font-display text-title font-bold text-foreground sm:text-[28px]">
            Super Admin On-Call Operations
          </h1>
          <p className="text-body-sm text-faint">
            Automated SLA escalation monitoring, on-call response analytics, and incident resolution tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {telemetry && (
            <span className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 ${
              telemetry.onCallStatus === "ACTIVE_ON_CALL"
                ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/60"
                : telemetry.onCallStatus === "DEGRADED"
                ? "bg-amber-950/80 text-amber-400 border-amber-800/60"
                : "bg-red-950/80 text-red-400 border-red-800/60"
            }`}>
              <span className="text-sm">●</span>
              {telemetry.onCallStatus}
            </span>
          )}

          <button
            onClick={fetchOnCallData}
            className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-all flex items-center gap-2 w-fit"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh On-Call
          </button>
        </div>
      </div>

      {isLoading || !telemetry ? (
        <div className="py-16 text-center text-gray-400 space-y-2">
          <span className="material-symbols-outlined text-3xl animate-spin text-primary">progress_activity</span>
          <p className="text-xs">Loading on-call operational metrics...</p>
        </div>
      ) : (
        <>
          {/* Executive KPI Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
              <div className="text-[11px] font-medium text-gray-400">Critical Incidents</div>
              <div className="text-xl font-bold text-red-400 font-mono">{telemetry.criticalIncidents}</div>
              <div className="text-[10px] text-red-400">Immediate response required</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
              <div className="text-[11px] font-medium text-gray-400">SLA At Risk</div>
              <div className="text-xl font-bold text-amber-300 font-mono">{telemetry.atRiskIncidents}</div>
              <div className="text-[10px] text-amber-300">Remaining time &lt;= 50%</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
              <div className="text-[11px] font-medium text-gray-400">SLA Breached</div>
              <div className="text-xl font-bold text-red-500 font-mono">{telemetry.breachedIncidents}</div>
              <div className="text-[10px] text-red-500">Target SLA window missed</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
              <div className="text-[11px] font-medium text-gray-400">Escalations Today</div>
              <div className="text-xl font-bold text-amber-400 font-mono">{telemetry.escalationsTodayCount}</div>
              <div className="text-[10px] text-amber-400">Level 1-3 triggers fired</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
              <div className="text-[11px] font-medium text-gray-400">Avg Ack Time</div>
              <div className="text-xl font-bold text-white font-mono">{telemetry.responseAnalytics.avgAckTimeMinutes} <span className="text-xs text-gray-400 font-sans">min</span></div>
              <div className="text-[10px] text-sky-400">Time to first response</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-1">
              <div className="text-[11px] font-medium text-gray-400">Avg Resolution Time</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">{telemetry.responseAnalytics.avgResolutionTimeMinutes} <span className="text-xs text-gray-400 font-sans">min</span></div>
              <div className="text-[10px] text-emerald-400">Time to complete fix</div>
            </div>
          </div>

          {/* Response Time Analytics & Escalation Timeline Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Analytics Card */}
            <div className="p-5 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-3 lg:col-span-1">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">timer</span>
                Incident Response Analytics
              </h2>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 rounded-xl bg-black/40 border border-[#262626] flex justify-between items-center">
                  <span className="text-gray-400 font-sans">Mean Acknowledge Time:</span>
                  <span className="text-white font-bold">{telemetry.responseAnalytics.avgAckTimeMinutes} min</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-[#262626] flex justify-between items-center">
                  <span className="text-gray-400 font-sans">Median Acknowledge Time:</span>
                  <span className="text-sky-400 font-bold">{telemetry.responseAnalytics.medianAckTimeMinutes} min</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-[#262626] flex justify-between items-center">
                  <span className="text-gray-400 font-sans">P90 Resolution Target:</span>
                  <span className="text-amber-400 font-bold">{telemetry.responseAnalytics.p90ResolutionTimeMinutes} min</span>
                </div>
              </div>
            </div>

            {/* Live Escalation Timeline */}
            <div className="p-5 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-3 lg:col-span-2">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-base">trending_up</span>
                Live SLA Escalation Log (Today)
              </h2>
              <div className="space-y-2 text-xs font-mono">
                {telemetry.escalationTimeline.map((esc) => (
                  <div key={esc.id} className="p-3 rounded-xl bg-black/40 border border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/60">
                        LEVEL {esc.level}
                      </span>
                      <span className="text-white font-sans font-medium">{esc.reason}</span>
                    </div>
                    <span className="text-gray-400 text-[11px] whitespace-nowrap">{new Date(esc.triggeredAt).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* On-Call Incidents Queue Table */}
          <div className="p-6 rounded-2xl bg-[#1E1F26] border border-[#262626] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF6D00]">emergency</span>
                On-Call Operational Queue (Sorted by Urgency)
              </h2>
              <span className="text-xs font-mono text-gray-400">{telemetry.incidents.length} Cases</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-black/40 text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#262626]">
                  <tr>
                    <th className="py-2.5 px-3">Incident #</th>
                    <th className="py-2.5 px-3">Title &amp; Category</th>
                    <th className="py-2.5 px-3 text-center">Severity</th>
                    <th className="py-2.5 px-3 text-center">SLA State</th>
                    <th className="py-2.5 px-3 text-center">Due Target</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">On-Call Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {telemetry.incidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        <button
                          onClick={() => setSelectedIncident(inc)}
                          className="hover:text-primary transition-colors"
                        >
                          {inc.incidentNumber}
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{inc.title}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{inc.category} • {inc.description}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                          inc.severity === "CRITICAL"
                            ? "bg-red-950/80 text-red-400 border-red-800/60"
                            : inc.severity === "HIGH"
                            ? "bg-amber-950/80 text-amber-400 border-amber-800/60"
                            : "bg-blue-950/80 text-blue-400 border-blue-800/60"
                        }`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center justify-center gap-1 w-fit mx-auto ${
                          inc.slaState === "ON_TRACK"
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                            : inc.slaState === "AT_RISK"
                            ? "bg-amber-950/60 text-amber-400 border-amber-800/40"
                            : inc.slaState === "BREACHED"
                            ? "bg-red-950/60 text-red-400 border-red-800/40"
                            : "bg-blue-950/60 text-blue-400 border-blue-800/40"
                        }`}>
                          <span>●</span> {inc.slaState}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-amber-400">
                        {new Date(inc.dueAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                          inc.status === "OPEN"
                            ? "bg-amber-950/40 text-amber-300 border-amber-800/30"
                            : inc.status === "ACKNOWLEDGED"
                            ? "bg-sky-950/40 text-sky-300 border-sky-800/30"
                            : inc.status === "IN_PROGRESS"
                            ? "bg-indigo-950/40 text-indigo-300 border-indigo-800/30"
                            : inc.status === "ESCALATED"
                            ? "bg-red-950/40 text-red-300 border-red-800/30"
                            : "bg-emerald-950/40 text-emerald-300 border-emerald-800/30"
                        }`}>
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        {inc.status === "OPEN" && (
                          <button
                            onClick={() => handleAction(inc.id, "ACKNOWLEDGE")}
                            disabled={actioningId === inc.id}
                            className="px-2 py-1 rounded-lg bg-black/40 border border-[#262626] text-gray-300 hover:text-white text-[11px] font-semibold transition-all"
                          >
                            Ack
                          </button>
                        )}

                        {inc.status === "ACKNOWLEDGED" && (
                          <button
                            onClick={() => handleAction(inc.id, "START_WORK")}
                            disabled={actioningId === inc.id}
                            className="px-2 py-1 rounded-lg bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-800/60 text-[11px] font-semibold transition-all"
                          >
                            Start Work
                          </button>
                        )}

                        {inc.status !== "RESOLVED" && inc.status !== "CLOSED" && (
                          <button
                            onClick={() => setShowResolveModal(inc)}
                            disabled={actioningId === inc.id}
                            className="px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-[11px] font-semibold transition-all"
                          >
                            Resolve
                          </button>
                        )}

                        {inc.status === "RESOLVED" && (
                          <button
                            onClick={() => handleAction(inc.id, "CLOSE")}
                            disabled={actioningId === inc.id}
                            className="px-2 py-1 rounded-lg bg-gray-800 text-gray-300 hover:text-white text-[11px] font-semibold transition-all"
                          >
                            Close Case
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Incident Resolve Notes Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E1F26] border border-[#262626] rounded-2xl w-full max-w-md p-6 space-y-4 text-foreground">
            <div className="flex items-start justify-between border-b border-[#262626] pb-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Resolve On-Call Incident</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{showResolveModal.incidentNumber}</h3>
              </div>
              <button
                onClick={() => setShowResolveModal(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">Resolution Notes (Mandatory for High/Critical)</label>
              <textarea
                value={resolutionInput}
                onChange={(e) => setResolutionInput(e.target.value)}
                placeholder="Describe root cause investigation and corrective operational action taken..."
                rows={4}
                className="w-full rounded-xl bg-black/50 border border-[#262626] p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResolveModal(null)}
                className="px-3 py-1.5 rounded-xl bg-black/40 border border-[#262626] text-gray-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(showResolveModal.id, "RESOLVE", resolutionInput)}
                disabled={!resolutionInput.trim()}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-semibold disabled:opacity-50 transition-all"
              >
                Submit Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Detail & Timeline Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E1F26] border border-[#262626] rounded-2xl w-full max-w-lg p-6 space-y-4 text-foreground max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#262626] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-primary">{selectedIncident.incidentNumber}</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedIncident.title}</h3>
                <p className="text-xs text-gray-400">{selectedIncident.description}</p>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-black/40 border border-[#262626]">
                <div>
                  <span className="text-gray-500 font-semibold block">Severity</span>
                  <span className="text-white font-mono font-bold">{selectedIncident.severity}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block">Category</span>
                  <span className="text-white font-mono font-bold">{selectedIncident.category}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block">Source</span>
                  <span className="text-sky-400 font-mono">{selectedIncident.sourceType} ({selectedIncident.sourceId})</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block">SLA Target Due</span>
                  <span className="text-amber-400 font-mono">{new Date(selectedIncident.dueAt).toLocaleTimeString()}</span>
                </div>
              </div>

              {selectedIncident.resolutionNotes && (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-1">
                  <div className="text-emerald-400 font-semibold">Resolution Notes</div>
                  <p className="text-gray-300">{selectedIncident.resolutionNotes}</p>
                </div>
              )}

              {/* Audit Timeline */}
              <div className="p-3 rounded-xl bg-black/40 border border-[#262626] space-y-2">
                <div className="text-gray-400 font-semibold">On-Call Incident Audit Timeline</div>
                <div className="space-y-2 font-mono text-[11px] text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span>{new Date(selectedIncident.createdAt).toLocaleTimeString()} — Created ({selectedIncident.sourceType})</span>
                  </div>
                  {selectedIncident.acknowledgedAt && (
                    <div className="flex items-center gap-2 text-sky-400">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      <span>{new Date(selectedIncident.acknowledgedAt).toLocaleTimeString()} — Acknowledged by Super Admin</span>
                    </div>
                  )}
                  {selectedIncident.escalatedAt && (
                    <div className="flex items-center gap-2 text-red-400">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span>{new Date(selectedIncident.escalatedAt).toLocaleTimeString()} — Escalated</span>
                    </div>
                  )}
                  {selectedIncident.resolvedAt && (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>{new Date(selectedIncident.resolvedAt).toLocaleTimeString()} — Resolved</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
