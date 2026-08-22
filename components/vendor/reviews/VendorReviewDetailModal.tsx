"use client";

import { useState } from "react";
import type { VendorReviewItem } from "@/lib/supabase/vendor_reviews";

export interface VendorReviewDetailModalProps {
  review: VendorReviewItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSendReply: (reviewId: string, replyText: string) => Promise<void>;
  onReport: (reviewId: string, reason: string) => Promise<void>;
}

export function VendorReviewDetailModal({
  review,
  isOpen,
  onClose,
  onSendReply,
  onReport,
}: VendorReviewDetailModalProps) {
  const [replyInput, setReplyInput] = useState("");
  const [reportReasonInput, setReportReasonInput] = useState("");
  const [isReportingMode, setIsReportingMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !review) return null;

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const text = replyInput.trim();
    if (!text) return;

    if (text.length > 500) {
      setErrorMsg("Response cannot exceed 500 characters.");
      return;
    }

    setIsSubmitting(true);
    await onSendReply(review.id, text);
    setIsSubmitting(false);
    setReplyInput("");
    onClose();
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const reason = reportReasonInput.trim();
    if (!reason) return;

    setIsSubmitting(true);
    await onReport(review.id, reason);
    setIsSubmitting(false);
    setIsReportingMode(false);
    setReportReasonInput("");
    onClose();
  };

  const stars = Array.from({ length: 5 }, (_, i) => i < review.rating);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-display text-title font-bold text-foreground">
              Review Details — Order #{review.orderNumber}
            </h3>
            <span className="text-caption text-muted">
              {new Date(review.createdAtIso).toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-muted hover:bg-background hover:text-foreground"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-caption font-semibold text-danger">
            {errorMsg}
          </div>
        )}

        {/* Rating Stars & Dish */}
        <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-4">
          <div className="flex items-center gap-1 text-amber-400">
            {stars.map((filled, idx) => (
              <span key={idx} className="material-symbols-outlined text-[22px]">
                {filled ? "star" : "star_outline"}
              </span>
            ))}
            <span className="ml-1 font-display font-extrabold text-title text-foreground">
              {review.rating}.0 / 5.0
            </span>
          </div>

          {review.menuItemName && (
            <span className="rounded-md bg-surface-elevated px-3 py-1 font-display text-caption font-bold text-muted border border-border">
              {review.menuItemName}
            </span>
          )}
        </div>

        {/* Review Text Box */}
        <div className="rounded-2xl border border-border bg-background p-4">
          <span className="font-display text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
            Customer Review Text:
          </span>
          <p className="text-body-sm text-foreground leading-relaxed">
            "{review.reviewText || "No written review text provided."}"
          </p>
        </div>

        {/* Existing Reply */}
        {review.vendorReply ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-display text-[10px] font-bold uppercase tracking-wider text-primary">
                Your Published Response:
              </span>
              {review.vendorRepliedAtIso && (
                <span className="text-[10px] text-faint">
                  {new Date(review.vendorRepliedAtIso).toLocaleDateString()}
                </span>
              )}
            </div>
            <p className="text-body-sm text-foreground italic">
              "{review.vendorReply}"
            </p>
          </div>
        ) : !isReportingMode ? (
          /* Vendor Reply Form */
          <form onSubmit={handleReplySubmit} className="flex flex-col gap-3 pt-2">
            <div>
              <label className="mb-1 block font-display text-caption font-bold text-muted">
                Write Response to Customer (Max 500 chars)
              </label>
              <textarea
                required
                rows={3}
                maxLength={500}
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder="Thank the customer for their review or address their feedback..."
                className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsReportingMode(true)}
                className="flex items-center gap-1 font-display text-caption font-bold text-danger hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">flag</span>
                Report Review
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 font-display text-caption font-bold text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !replyInput.trim()}
                  className="rounded-xl bg-primary px-5 py-2.5 font-display text-caption font-extrabold text-on-primary shadow-glow-primary hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Publishing..." : "Send Response"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Report Form */
          <form onSubmit={handleReportSubmit} className="flex flex-col gap-3 pt-2">
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3">
              <span className="font-display font-bold text-danger block mb-1">
                Report Inappropriate Review to Super Admin
              </span>
              <textarea
                required
                rows={2}
                value={reportReasonInput}
                onChange={(e) => setReportReasonInput(e.target.value)}
                placeholder="Describe reason (e.g. Offensive language, spam, incorrect canteen)..."
                className="w-full rounded-xl border border-border bg-background p-2.5 text-body-sm text-foreground focus:border-danger focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReportingMode(false)}
                disabled={isSubmitting}
                className="rounded-xl border border-border bg-background px-4 py-2.5 font-display text-caption font-bold text-muted"
              >
                Cancel Report
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reportReasonInput.trim()}
                className="rounded-xl bg-danger px-5 py-2.5 font-display text-caption font-bold text-white shadow-lg shadow-danger/20 hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
