"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type {
  VendorApplicationItem,
  PrerequisiteChecklist,
  KycStatus,
  ApplicationStatus,
} from "@/lib/supabase/superadmin_vendor_applications";

interface VendorApplicationDetailModalProps {
  applicationId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export function VendorApplicationDetailModal({
  applicationId,
  onClose,
  onRefresh,
}: VendorApplicationDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<VendorApplicationItem | null>(null);
  const [prerequisites, setPrerequisites] = useState<PrerequisiteChecklist | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states for actions
  const [reasonInput, setReasonInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeAction, setActiveAction] = useState<"approve" | "reject" | "verify_kyc" | "reject_kyc" | "suspend" | null>(null);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/superadmin/vendors/applications/${applicationId}`);
      const data = await res.json();
      if (data.ok) {
        setApp(data.application);
        setPrerequisites(data.prerequisites);
      } else {
        setError(data.error || "Failed to load application profile.");
      }
    } catch (err: any) {
      setError(err?.message || "Error fetching details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [applicationId]);

  const handleAction = async (
    actionType: "update_app_status" | "update_kyc_status" | "suspend_vendor",
    payload: { newApplicationStatus?: ApplicationStatus; newKycStatus?: KycStatus },
  ) => {
    setError(null);

    if ((payload.newApplicationStatus === "rejected" || payload.newKycStatus === "rejected" || actionType === "suspend_vendor") && !reasonInput.trim()) {
      setError("A reason is required to perform this action.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/superadmin/vendors/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          newApplicationStatus: payload.newApplicationStatus,
          newKycStatus: payload.newKycStatus,
          reason: reasonInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setReasonInput("");
        setActiveAction(null);
        await loadDetails();
        onRefresh();
      } else {
        setError(data.error || "Failed to perform action.");
      }
    } catch (err: any) {
      setError(err?.message || "Error submitting decision.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[26px]">
              verified
            </span>
            <div>
              <h2 className="font-display text-title font-bold text-foreground">
                Vendor Application & KYC Review
              </h2>
              <p className="font-display text-caption text-muted">
                Review business profile, manager identity, KYC compliance, and onboarding status
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
        ) : error || !app ? (
          <div className="py-10 text-center space-y-3">
            <p className="font-display text-body font-bold text-danger">{error || "Application not found."}</p>
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
                    {app.vendorName}
                  </h3>
                  <span className="rounded-full bg-primary/10 border border-primary/30 px-2.5 py-0.5 font-display text-[10px] font-extrabold text-primary uppercase">
                    {app.category}
                  </span>
                </div>
                <p className="font-display text-caption text-muted mt-0.5">
                  Owner: {app.ownerName} • {app.phone} • {app.campusName || "Main Campus"}
                </p>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 font-display text-caption font-extrabold capitalize ${
                    app.applicationStatus === "approved"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : app.applicationStatus === "rejected"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  App: {app.applicationStatus.replace("_", " ")}
                </span>
                <span
                  className={`rounded-full px-3 py-1 font-display text-caption font-extrabold capitalize ${
                    app.kycStatus === "verified"
                      ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  KYC: {app.kycStatus}
                </span>
              </div>
            </div>

            {/* Error Feedback */}
            {error && (
              <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-caption font-display font-bold text-danger">
                {error}
              </div>
            )}

            {/* Prerequisite Readiness Checklist */}
            {prerequisites && (
              <div className="rounded-2xl border border-border bg-background/30 p-4 space-y-3">
                <h4 className="font-display text-caption font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Vendor Onboarding Prerequisites</span>
                  <span className={`text-[11px] font-extrabold ${prerequisites.isReadyForApproval ? "text-emerald-400" : "text-amber-400"}`}>
                    {prerequisites.isReadyForApproval ? "✓ Ready for Approval" : "⚠ Prerequisites Incomplete"}
                  </span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-display">
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-[16px] ${prerequisites.hasValidUser ? "text-emerald-400" : "text-muted"}`}>
                      {prerequisites.hasValidUser ? "check_circle" : "cancel"}
                    </span>
                    <span>User Account</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-[16px] ${prerequisites.hasProfileFields ? "text-emerald-400" : "text-muted"}`}>
                      {prerequisites.hasProfileFields ? "check_circle" : "cancel"}
                    </span>
                    <span>Store Profile</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-[16px] ${prerequisites.isKycVerified ? "text-emerald-400" : "text-muted"}`}>
                      {prerequisites.isKycVerified ? "check_circle" : "cancel"}
                    </span>
                    <span>KYC Verified</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-[16px] ${prerequisites.hasBankPayoutConfigured ? "text-emerald-400" : "text-muted"}`}>
                      {prerequisites.hasBankPayoutConfigured ? "check_circle" : "cancel"}
                    </span>
                    <span>Bank Payout</span>
                  </div>
                </div>
              </div>
            )}

            {/* Business Information Section */}
            <div className="space-y-2">
              <h4 className="font-display text-body-sm font-bold text-foreground">
                Business & Store Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-display text-caption">
                <div className="rounded-xl border border-border/60 bg-background/30 p-3">
                  <span className="text-muted text-[11px] block font-bold">Business Email</span>
                  <span className="text-foreground">{app.email}</span>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/30 p-3">
                  <span className="text-muted text-[11px] block font-bold">Store Address / Slot</span>
                  <span className="text-foreground">{app.address || "Campus Food Court"}</span>
                </div>
                {app.description && (
                  <div className="sm:col-span-2 rounded-xl border border-border/60 bg-background/30 p-3">
                    <span className="text-muted text-[11px] block font-bold">Description</span>
                    <span className="text-foreground">{app.description}</span>
                  </div>
                )}
              </div>
            </div>

            {/* KYC Documents Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-body-sm font-bold text-foreground flex items-center gap-2">
                  <span className="material-symbols-outlined text-muted text-[18px]">badge</span>
                  <span>KYC Compliance Documents</span>
                </h4>
                <div className="flex items-center gap-2">
                  {app.kycStatus !== "verified" && (
                    <button
                      type="button"
                      onClick={() => handleAction("update_kyc_status", { newKycStatus: "verified" })}
                      disabled={submitting}
                      className="rounded-xl bg-teal-500 px-3 py-1 font-display text-caption font-bold text-black hover:bg-teal-400 transition-colors"
                    >
                      Verify KYC
                    </button>
                  )}
                  {app.kycStatus !== "rejected" && (
                    <button
                      type="button"
                      onClick={() => setActiveAction("reject_kyc")}
                      className="rounded-xl border border-border bg-background px-3 py-1 font-display text-caption font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      Reject KYC
                    </button>
                  )}
                </div>
              </div>

              {app.kycDocuments.length === 0 ? (
                <p className="font-display text-caption text-muted italic bg-background/30 rounded-xl p-3 border border-border/40">
                  No KYC documents submitted yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {app.kycDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 p-3 font-display text-caption"
                    >
                      <div>
                        <div className="font-bold text-foreground line-clamp-1">{doc.docName}</div>
                        <div className="text-[11px] text-muted capitalize">{doc.docType.replace("_", " ")}</div>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-background transition-colors"
                      >
                        <span>Preview</span>
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Conditional Action Input Box for Rejection / Suspension */}
            {activeAction && (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 space-y-3 animate-in fade-in">
                <h4 className="font-display text-caption font-bold text-rose-400 uppercase">
                  {activeAction === "reject" ? "Reject Application" : activeAction === "reject_kyc" ? "Reject KYC Documents" : "Suspend Vendor"}
                </h4>
                <input
                  type="text"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="Enter mandatory reason..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground placeholder:text-muted focus:border-rose-400 focus:outline-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAction(null);
                      setReasonInput("");
                    }}
                    className="rounded-xl border border-border bg-background px-3 py-1.5 font-display text-caption font-bold text-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      if (activeAction === "reject") {
                        handleAction("update_app_status", { newApplicationStatus: "rejected" });
                      } else if (activeAction === "reject_kyc") {
                        handleAction("update_kyc_status", { newKycStatus: "rejected" });
                      } else if (activeAction === "suspend") {
                        handleAction("suspend_vendor", {});
                      }
                    }}
                    className="rounded-xl bg-rose-500 px-4 py-1.5 font-display text-caption font-bold text-white hover:bg-rose-600 transition-colors"
                  >
                    {submitting ? "Processing..." : "Confirm Action"}
                  </button>
                </div>
              </div>
            )}

            {/* Deep Links & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-4">
              {/* Deep Links */}
              <div className="flex items-center gap-3 text-caption font-display">
                <Link
                  href="/superadmin/vendors"
                  className="text-muted hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">storefront</span>
                  <span>Vendor Oversight</span>
                </Link>
                <Link
                  href="/superadmin/vendor-performance"
                  className="text-muted hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">monitoring</span>
                  <span>Performance</span>
                </Link>
                <Link
                  href="/superadmin/settlements"
                  className="text-muted hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">payments</span>
                  <span>Settlements</span>
                </Link>
              </div>

              {/* Application Approval / Rejection / Suspension Buttons */}
              <div className="flex items-center gap-2">
                {app.applicationStatus !== "approved" && (
                  <button
                    type="button"
                    disabled={submitting || app.kycStatus !== "verified"}
                    onClick={() => handleAction("update_app_status", { newApplicationStatus: "approved" })}
                    className="rounded-xl bg-primary px-4 py-2 font-display text-caption font-bold text-on-primary hover:bg-primary-hover disabled:opacity-50 transition-colors"
                  >
                    Approve Application
                  </button>
                )}

                {app.applicationStatus !== "rejected" && (
                  <button
                    type="button"
                    onClick={() => setActiveAction("reject")}
                    className="rounded-xl border border-border bg-background px-4 py-2 font-display text-caption font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    Reject Application
                  </button>
                )}

                {app.vendorStatus !== "suspended" && app.applicationStatus === "approved" && (
                  <button
                    type="button"
                    onClick={() => setActiveAction("suspend")}
                    className="rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-2 font-display text-caption font-bold text-purple-400 hover:bg-purple-500/20 transition-colors"
                  >
                    Suspend Vendor
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
