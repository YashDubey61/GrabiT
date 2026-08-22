"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type {
  DisputeItem,
  DisputeTimelineEvent,
  OrderRefundCalculation,
  DisputeStatus,
} from "@/lib/supabase/superadmin_disputes";

interface DisputeDetailModalProps {
  disputeId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export function DisputeDetailModal({ disputeId, onClose, onRefresh }: DisputeDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [dispute, setDispute] = useState<DisputeItem | null>(null);
  const [timeline, setTimeline] = useState<DisputeTimelineEvent[]>([]);
  const [refundCalc, setRefundCalc] = useState<OrderRefundCalculation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refund Form State
  const [refundAmountInput, setRefundAmountInput] = useState<string>("");
  const [refundReasonInput, setRefundReasonInput] = useState<string>("");
  const [resolutionInput, setResolutionInput] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [activeAction, setActiveAction] = useState<"refund" | "status_change" | null>(null);
  const [targetStatus, setTargetStatus] = useState<DisputeStatus | null>(null);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/superadmin/disputes/${disputeId}`);
      const data = await res.json();
      if (data.ok) {
        setDispute(data.dispute);
        setTimeline(data.timeline);
        setRefundCalc(data.refundCalc);
        setRefundAmountInput(data.refundCalc?.refundableBalance?.toString() || data.dispute?.disputeAmount?.toString() || "0");
      } else {
        setError(data.error || "Failed to load dispute profile.");
      }
    } catch (err: any) {
      setError(err?.message || "Error fetching dispute details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [disputeId]);

  const handleUpdateStatus = async (status: DisputeStatus) => {
    if (status === "RESOLVED" && !resolutionInput.trim()) {
      setError("A resolution explanation is mandatory when resolving a dispute.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`/api/superadmin/disputes/${disputeId}`, {
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
        setError(data.error || "Failed to update dispute status.");
      }
    } catch (err: any) {
      setError(err?.message || "Error submitting status change.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessRefund = async () => {
    const amt = parseFloat(refundAmountInput);
    if (isNaN(amt) || amt <= 0) {
      setError("Refund amount must be a positive number.");
      return;
    }

    if (!refundReasonInput.trim()) {
      setError("A refund reason is mandatory.");
      return;
    }

    if (refundCalc && amt > refundCalc.refundableBalance && refundCalc.refundableBalance > 0) {
      setError(`Refund Safety Guard: Amount (₹${amt}) exceeds refundable balance (₹${refundCalc.refundableBalance}).`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`/api/superadmin/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process_refund",
          refundAmount: amt,
          reason: refundReasonInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setRefundReasonInput("");
        setActiveAction(null);
        await loadDetails();
        onRefresh();
      } else {
        setError(data.error || "Failed to process refund.");
      }
    } catch (err: any) {
      setError(err?.message || "Error processing refund.");
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
              support_agent
            </span>
            <div>
              <h2 className="font-display text-title font-bold text-foreground">
                Dispute & Refund Investigation ({dispute?.disputeNumber || disputeId})
              </h2>
              <p className="font-display text-caption text-muted">
                Order details, payment validation, evidence timeline, and refund safety processing
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
        ) : error || !dispute ? (
          <div className="py-10 text-center space-y-3">
            <p className="font-display text-body font-bold text-danger">{error || "Dispute not found."}</p>
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
                    Order {dispute.orderNumber || dispute.orderId}
                  </h3>
                  <span className="rounded-full bg-primary/10 border border-primary/30 px-2.5 py-0.5 font-display text-[10px] font-extrabold text-primary uppercase">
                    {dispute.disputeType.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="font-display text-caption text-muted mt-0.5">
                  Customer: {dispute.userName} • Canteen: {dispute.canteenName} • {dispute.campusName}
                </p>
              </div>

              {/* Priority & Status Badges */}
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 font-display text-caption font-extrabold capitalize ${
                    dispute.priority === "CRITICAL"
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : dispute.priority === "HIGH"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {dispute.priority} Priority
                </span>
                <span
                  className={`rounded-full px-3 py-1 font-display text-caption font-extrabold capitalize ${
                    dispute.status === "RESOLVED"
                      ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {dispute.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            {/* Error Feedback */}
            {error && (
              <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-caption font-display font-bold text-danger">
                {error}
              </div>
            )}

            {/* Refund Safety Confirmation Summary Card */}
            {refundCalc && (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                <h4 className="font-display text-caption font-bold text-primary uppercase tracking-wider flex items-center justify-between">
                  <span>Refund Safety Calculation</span>
                  <span className="text-[11px] font-extrabold text-foreground">
                    {refundCalc.isEligibleForRefund ? "Eligible for Refund" : "Refund Fully Settled"}
                  </span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-display text-caption">
                  <div className="rounded-xl border border-border/60 bg-background/50 p-2.5">
                    <span className="text-muted text-[11px] block">Original Order Total</span>
                    <span className="text-foreground font-bold">₹{refundCalc.orderTotal}</span>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/50 p-2.5">
                    <span className="text-muted text-[11px] block">Already Refunded</span>
                    <span className="text-foreground font-bold">₹{refundCalc.alreadyRefunded}</span>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/50 p-2.5">
                    <span className="text-muted text-[11px] block">Refundable Balance</span>
                    <span className="text-emerald-400 font-extrabold">₹{refundCalc.refundableBalance}</span>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/50 p-2.5">
                    <span className="text-muted text-[11px] block">Refund Status</span>
                    <span className="text-foreground font-bold capitalize">{dispute.refundStatus}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Complaint Description */}
            <div className="space-y-2">
              <h4 className="font-display text-body-sm font-bold text-foreground">
                Customer Complaint Statement
              </h4>
              <div className="rounded-xl border border-border/60 bg-background/30 p-3.5 font-display text-caption text-foreground leading-relaxed">
                "{dispute.description}"
              </div>
            </div>

            {/* Vendor Response Section */}
            {dispute.vendorResponse && (
              <div className="space-y-2">
                <h4 className="font-display text-body-sm font-bold text-foreground">
                  Vendor Statement & Information
                </h4>
                <div className="rounded-xl border border-border/60 bg-background/30 p-3.5 font-display text-caption text-muted">
                  "{dispute.vendorResponse}"
                </div>
              </div>
            )}

            {/* Evidence Timeline */}
            <div className="space-y-3">
              <h4 className="font-display text-body-sm font-bold text-foreground flex items-center gap-2">
                <span className="material-symbols-outlined text-muted text-[18px]">history</span>
                <span>Chronological Evidence Timeline</span>
              </h4>
              <div className="relative border-l-2 border-border/80 ml-3 pl-4 space-y-3 font-display">
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

            {/* Refund Action Confirmation Box */}
            {activeAction === "refund" && (
              <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 space-y-3 animate-in fade-in">
                <h4 className="font-display text-caption font-bold text-primary uppercase">
                  Safety Confirmation — Process Refund
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-display text-[11px] font-bold text-muted block mb-1">
                      Refund Amount (Max ₹{refundCalc?.refundableBalance || dispute.disputeAmount})
                    </label>
                    <input
                      type="number"
                      value={refundAmountInput}
                      onChange={(e) => setRefundAmountInput(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-display text-[11px] font-bold text-muted block mb-1">
                      Refund Reason / Audit Note
                    </label>
                    <input
                      type="text"
                      value={refundReasonInput}
                      onChange={(e) => setRefundReasonInput(e.target.value)}
                      placeholder="Enter mandatory refund reason..."
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAction(null);
                      setRefundReasonInput("");
                    }}
                    className="rounded-xl border border-border bg-background px-3 py-1.5 font-display text-caption font-bold text-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleProcessRefund}
                    className="rounded-xl bg-primary px-4 py-1.5 font-display text-caption font-bold text-on-primary hover:bg-primary-hover transition-colors"
                  >
                    {submitting ? "Processing..." : "Confirm & Credit Refund"}
                  </button>
                </div>
              </div>
            )}

            {/* Status Change Form Box */}
            {activeAction === "status_change" && (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3 animate-in fade-in">
                <h4 className="font-display text-caption font-bold text-amber-400 uppercase">
                  Change Dispute Status to: {targetStatus?.replace(/_/g, " ")}
                </h4>
                {targetStatus === "RESOLVED" && (
                  <input
                    type="text"
                    value={resolutionInput}
                    onChange={(e) => setResolutionInput(e.target.value)}
                    placeholder="Enter mandatory resolution summary..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground focus:border-amber-400 focus:outline-none"
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
                    {submitting ? "Processing..." : "Confirm Status Update"}
                  </button>
                </div>
              </div>
            )}

            {/* Deep Links & Action Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-4">
              {/* Deep Links */}
              <div className="flex flex-wrap items-center gap-3 text-caption font-display">
                <Link
                  href="/superadmin/users"
                  className="text-muted hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                  <span>User Management</span>
                </Link>
                <Link
                  href="/superadmin/vendors"
                  className="text-muted hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">storefront</span>
                  <span>Vendor Oversight</span>
                </Link>
                <Link
                  href="/superadmin/settlements"
                  className="text-muted hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">payments</span>
                  <span>Settlements</span>
                </Link>
                <Link
                  href="/superadmin/cashfree-payments"
                  className="text-muted hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">credit_card</span>
                  <span>Payments</span>
                </Link>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {refundCalc?.isEligibleForRefund && dispute.refundStatus !== "COMPLETED" && (
                  <button
                    type="button"
                    onClick={() => setActiveAction("refund")}
                    className="rounded-xl bg-primary px-4 py-2 font-display text-caption font-bold text-on-primary hover:bg-primary-hover transition-colors"
                  >
                    Process Refund
                  </button>
                )}

                {dispute.status !== "RESOLVED" && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAction("status_change");
                      setTargetStatus("RESOLVED");
                    }}
                    className="rounded-xl bg-teal-500 px-3.5 py-2 font-display text-caption font-bold text-black hover:bg-teal-400 transition-colors"
                  >
                    Resolve Dispute
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
