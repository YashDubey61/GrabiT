"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type {
  RiskCaseItem,
  EvidenceTimelineEvent,
  CaseStatus,
} from "@/lib/supabase/superadmin_risk";

interface RiskDetailModalProps {
  caseId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export function RiskDetailModal({ caseId, onClose, onRefresh }: RiskDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [caseItem, setCaseItem] = useState<RiskCaseItem | null>(null);
  const [timeline, setTimeline] = useState<EvidenceTimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [noteInput, setNoteInput] = useState("");
  const [resolutionInput, setResolutionInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeAction, setActiveAction] = useState<"status_change" | "add_note" | null>(null);
  const [targetStatus, setTargetStatus] = useState<CaseStatus | null>(null);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/superadmin/risk/${caseId}`);
      const data = await res.json();
      if (data.ok) {
        setCaseItem(data.caseItem);
        setTimeline(data.timeline);
      } else {
        setError(data.error || "Failed to load risk case profile.");
      }
    } catch (err: any) {
      setError(err?.message || "Error fetching case details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [caseId]);

  const handleUpdateStatus = async (status: CaseStatus) => {
    if ((status === "RESOLVED" || status === "DISMISSED") && !resolutionInput.trim()) {
      setError("A resolution explanation is mandatory to resolve or dismiss a case.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`/api/superadmin/risk/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          newStatus: status,
          resolution: resolutionInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setResolutionInput("");
        setActiveAction(null);
        setTargetStatus(null);
        await loadDetails();
        onRefresh();
      } else {
        setError(data.error || "Failed to update case status.");
      }
    } catch (err: any) {
      setError(err?.message || "Error submitting status change.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteInput.trim()) {
      setError("Note content cannot be empty.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`/api/superadmin/risk/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_note",
          noteContent: noteInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setNoteInput("");
        await loadDetails();
      } else {
        setError(data.error || "Failed to add note.");
      }
    } catch (err: any) {
      setError(err?.message || "Error adding note.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[26px]">
              travel_explore
            </span>
            <div>
              <h2 className="font-display text-title font-bold text-foreground flex items-center gap-2">
                <span>Risk Case Inspection: {caseItem?.caseNumber || caseId}</span>
              </h2>
              <p className="font-display text-caption text-muted">
                Centralized risk investigation, explainable scoring, timeline evidence, and notes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted hover:bg-background hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-4 py-12 animate-pulse">
            <div className="h-6 w-48 bg-border/40 rounded" />
            <div className="h-24 w-full bg-border/20 rounded-2xl" />
            <div className="h-32 w-full bg-border/20 rounded-2xl" />
          </div>
        ) : error || !caseItem ? (
          <div className="py-10 text-center space-y-3">
            <p className="font-display text-body font-bold text-danger">{error || "Risk case not found."}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-background px-4 py-2 font-display text-caption font-bold text-foreground"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-background/50 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-headline font-extrabold text-foreground">
                    {caseItem.entityName}
                  </h3>
                  <span className="rounded-full bg-primary/10 border border-primary/30 px-2.5 py-0.5 font-display text-[10px] font-extrabold text-primary uppercase">
                    {caseItem.entityType}
                  </span>
                </div>
                <p className="font-display text-caption text-muted mt-0.5">
                  ID: {caseItem.entityId} • Campus: {caseItem.campusName || "Main Campus"}
                </p>
              </div>

              {/* Risk Level & Score Badge */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-muted text-[11px] font-bold block uppercase">Risk Score</span>
                  <span className="font-display text-title font-extrabold text-foreground">
                    {caseItem.riskScore} <span className="text-muted text-caption font-normal">/100</span>
                  </span>
                </div>

                <span
                  className={`rounded-2xl px-3.5 py-1.5 font-display text-caption font-extrabold ${
                    caseItem.riskLevel === "CRITICAL"
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : caseItem.riskLevel === "HIGH"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : caseItem.riskLevel === "MEDIUM"
                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {caseItem.riskLevel}
                </span>
              </div>
            </div>

            {/* Error Feedback */}
            {error && (
              <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-caption font-display font-bold text-danger">
                {error}
              </div>
            )}

            {/* Triggered Signals Breakdown */}
            <div className="space-y-3">
              <h4 className="font-display text-body-sm font-bold text-foreground flex items-center justify-between">
                <span>Triggered Risk Signals ({caseItem.signals.length})</span>
                <span className="text-[11px] font-normal text-muted">Server-side explainable rules</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {caseItem.signals.map((sig, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-xl border border-border/70 bg-background/30 p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-caption font-bold text-foreground">
                        {sig.label}
                      </span>
                      <span className="font-display text-caption font-extrabold text-amber-400">
                        +{sig.points} pts
                      </span>
                    </div>
                    <p className="font-display text-[11px] text-muted leading-relaxed">
                      {sig.description}
                    </p>
                    <span className="font-display text-[10px] text-primary/80 uppercase font-extrabold">
                      {sig.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence Timeline */}
            <div className="space-y-3">
              <h4 className="font-display text-body-sm font-bold text-foreground flex items-center gap-2">
                <span className="material-symbols-outlined text-muted text-[18px]">history</span>
                <span>Chronological Evidence Timeline</span>
              </h4>
              <div className="relative border-l-2 border-border/80 ml-3 pl-4 space-y-4 font-display">
                {timeline.map((ev) => (
                  <div key={ev.id} className="relative">
                    <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-caption font-bold text-foreground">{ev.title}</span>
                      <span className="text-[11px] text-muted">
                        {new Date(ev.timestamp).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted mt-0.5">{ev.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Investigation Notes & Add Note Form */}
            <div className="space-y-3 border-t border-border pt-4">
              <h4 className="font-display text-body-sm font-bold text-foreground">
                Investigation Notes ({caseItem.notes.length})
              </h4>

              {/* Add Note Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add an investigation note..."
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleAddNote}
                  className="rounded-xl bg-primary px-4 py-2 font-display text-caption font-bold text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  Add Note
                </button>
              </div>

              {/* Existing Notes List */}
              {caseItem.notes.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {caseItem.notes.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl border border-border/60 bg-background/40 p-3 font-display text-caption"
                    >
                      <div className="flex items-center justify-between text-[11px] text-muted mb-1">
                        <span>Author: {n.authorAdminName || "Super Admin"}</span>
                        <span>{new Date(n.createdAt).toLocaleDateString("en-IN")}</span>
                      </div>
                      <p className="text-foreground">{n.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resolution Form Box */}
            {activeAction === "status_change" && (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3 animate-in fade-in">
                <h4 className="font-display text-caption font-bold text-amber-400 uppercase">
                  Change Case Status to: {targetStatus}
                </h4>
                {(targetStatus === "RESOLVED" || targetStatus === "DISMISSED") && (
                  <input
                    type="text"
                    value={resolutionInput}
                    onChange={(e) => setResolutionInput(e.target.value)}
                    placeholder="Enter mandatory resolution explanation..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground placeholder:text-muted focus:border-amber-400 focus:outline-none"
                  />
                )}
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAction(null);
                      setTargetStatus(null);
                      setResolutionInput("");
                    }}
                    className="rounded-xl border border-border bg-background px-3 py-1.5 font-display text-caption font-bold text-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => targetStatus && handleUpdateStatus(targetStatus)}
                    className="rounded-xl bg-amber-500 px-4 py-1.5 font-display text-caption font-bold text-black hover:bg-amber-400 transition-colors"
                  >
                    {submitting ? "Processing..." : "Confirm Status Change"}
                  </button>
                </div>
              </div>
            )}

            {/* Deep Links & Action Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-4">
              {/* Deep Links to Existing Modules */}
              <div className="flex flex-wrap items-center gap-3 text-caption font-display">
                <Link
                  href="/superadmin/users"
                  className="text-muted hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                  <span>User Management</span>
                </Link>
                <Link
                  href="/superadmin/vendors/applications"
                  className="text-muted hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Vendor Approval</span>
                </Link>
                <Link
                  href="/superadmin/vendors"
                  className="text-muted hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">storefront</span>
                  <span>Vendor Oversight</span>
                </Link>
                <Link
                  href="/superadmin/cashfree-payments"
                  className="text-muted hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">credit_card</span>
                  <span>Payments</span>
                </Link>
              </div>

              {/* Status Update Buttons */}
              <div className="flex items-center gap-2">
                {caseItem.status !== "INVESTIGATING" && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAction("status_change");
                      setTargetStatus("INVESTIGATING");
                    }}
                    className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 font-display text-caption font-bold text-primary hover:bg-primary/20 transition-colors"
                  >
                    Mark Investigating
                  </button>
                )}

                {caseItem.status !== "RESOLVED" && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAction("status_change");
                      setTargetStatus("RESOLVED");
                    }}
                    className="rounded-xl bg-teal-500 px-3.5 py-1.5 font-display text-caption font-bold text-black hover:bg-teal-400 transition-colors"
                  >
                    Resolve Case
                  </button>
                )}

                {caseItem.status !== "DISMISSED" && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAction("status_change");
                      setTargetStatus("DISMISSED");
                    }}
                    className="rounded-xl border border-border bg-background px-3 py-1.5 font-display text-caption font-bold text-muted hover:text-foreground transition-colors"
                  >
                    Dismiss Case
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
