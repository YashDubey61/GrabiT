"use client";

import type { VendorApprovalRequest } from "@/lib/mock/superadmin";

interface VendorApprovalQueueProps {
  requests: VendorApprovalRequest[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onViewHistory?: () => void;
}

export function VendorApprovalQueue({
  requests,
  onApprove,
  onReject,
  onViewHistory,
}: VendorApprovalQueueProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated/90 backdrop-blur-md shadow-xl sticky top-24">
      {/* Queue Header */}
      <div className="flex items-center justify-between border-b border-border bg-surface-sunken p-4">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Approval Queue
          </h3>
          <p className="font-display text-[10px] font-bold uppercase tracking-wider text-primary">
            {requests.length} Pending Verifications
          </p>
        </div>
        <span className="material-symbols-outlined text-[20px] text-faint" aria-hidden="true">
          history_edu
        </span>
      </div>

      {/* Requests List */}
      <div className="flex flex-col gap-3 p-4 max-h-[540px] overflow-y-auto hide-scrollbar">
        {requests.length === 0 ? (
          <div className="p-6 text-center text-caption text-faint">
            All vendor verification requests approved!
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="flex flex-col gap-3 rounded-xl border border-border/50 bg-surface-elevated p-3.5 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                      restaurant_menu
                    </span>
                  </div>
                  <div>
                    <p className="font-display text-body-sm font-bold text-foreground">
                      {req.vendorName}
                    </p>
                    <p className="text-[10px] text-faint">{req.typeText}</p>
                  </div>
                </div>

                <span
                  className={`rounded px-2 py-0.5 font-display text-[9px] font-bold uppercase ${
                    req.badgeType === "error"
                      ? "bg-danger/20 text-danger border border-danger/30"
                      : req.badgeType === "primary"
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-surface-sunken text-muted border border-border"
                  }`}
                >
                  {req.badgeTag}
                </span>
              </div>

              {/* Price Changes Breakdown */}
              {req.priceChanges && req.priceChanges.length > 0 && (
                <div className="flex flex-col gap-1.5 rounded-lg bg-surface-sunken p-2.5 font-body text-caption">
                  {req.priceChanges.map((pc, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-faint">{pc.itemName}</span>
                      <span className="font-mono text-muted">
                        ₹{pc.oldPrice} →{" "}
                        <span className="font-bold text-primary">₹{pc.newPrice}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Text Description */}
              {req.description && (
                <p className="text-caption text-faint leading-relaxed">
                  {req.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onApprove(req.id)}
                  className="flex-1 rounded-lg bg-primary py-1.5 font-display text-[11px] font-extrabold uppercase tracking-wider text-on-primary hover:opacity-90 active:scale-95 transition-all"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => onReject(req.id)}
                  className="rounded-lg border border-border px-3 py-1.5 font-display text-[11px] font-bold uppercase text-foreground hover:bg-danger/10 hover:text-danger active:scale-95 transition-all"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer History Link */}
      <div className="border-t border-border bg-surface-sunken p-3">
        <button
          type="button"
          onClick={onViewHistory}
          className="w-full rounded-lg border border-primary/30 py-2 font-display text-caption font-bold text-primary hover:bg-primary/10 transition-colors"
        >
          View Detailed History
        </button>
      </div>
    </div>
  );
}
