"use client";

import { useState } from "react";
import type { VendorOffer } from "@/lib/supabase/vendor_offers";

export interface VendorOfferCardProps {
  offer: VendorOffer;
  onToggleActive: (offerId: string, isActive: boolean) => Promise<void>;
  onEditOffer: (offer: VendorOffer) => void;
  onDeleteOffer: (offerId: string) => Promise<void>;
  onViewRedemptions: (offer: VendorOffer) => void;
}

export function VendorOfferCard({
  offer,
  onToggleActive,
  onEditOffer,
  onDeleteOffer,
  onViewRedemptions,
}: VendorOfferCardProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(offer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDeleteOffer(offer.id);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  const isExpired = offer.status === "EXPIRED";
  const isScheduled = offer.status === "SCHEDULED";
  const isPaused = offer.status === "PAUSED";
  const isActive = offer.status === "ACTIVE";

  return (
    <>
      <div
        className={`group relative flex flex-col justify-between rounded-2xl border p-5 backdrop-blur-md transition-all duration-200 ${
          isActive
            ? "border-primary/40 bg-surface-elevated hover:border-primary"
            : isScheduled
              ? "border-blue-500/30 bg-surface-elevated"
              : isPaused
                ? "border-border bg-surface-elevated/60"
                : "border-border bg-surface-elevated/40 opacity-75"
        }`}
      >
        <div className="flex flex-col gap-3">
          {/* Top Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Coupon Code Pill */}
              <button
                type="button"
                onClick={handleCopyCode}
                title="Click to copy coupon code"
                className="group/code flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-body-sm font-extrabold tracking-wider text-primary hover:bg-primary/20 transition-all"
              >
                <span>{offer.code}</span>
                <span className="material-symbols-outlined text-[14px] text-primary/70 group-hover/code:text-primary">
                  {copied ? "check" : "content_copy"}
                </span>
              </button>

              {/* Status Badge */}
              <span
                className={`rounded-full px-2.5 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-wider ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : isScheduled
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : isPaused
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-surface-elevated text-faint border border-border"
                }`}
              >
                {offer.status}
              </span>
            </div>

            {/* Actions Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Offer actions menu"
                className="rounded-lg p-1 text-muted hover:bg-background hover:text-foreground transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 z-30 w-40 rounded-xl border border-border bg-surface-elevated p-1 shadow-2xl animate-in fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onEditOffer(offer);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-display text-caption font-semibold text-foreground hover:bg-background"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">edit</span>
                    Edit Offer
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onViewRedemptions(offer);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-display text-caption font-semibold text-foreground hover:bg-background"
                  >
                    <span className="material-symbols-outlined text-[16px] text-blue-400">history</span>
                    Redemptions
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-display text-caption font-semibold text-danger hover:bg-danger/10"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Delete Offer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Offer Title & Description */}
          <div>
            <h3 className="font-display text-title font-extrabold text-foreground">
              {offer.discountType === "PERCENTAGE"
                ? `${offer.discountValue}% OFF`
                : `₹${offer.discountValue} OFF`}
            </h3>
            {offer.description && (
              <p className="mt-0.5 text-caption text-faint line-clamp-2">
                {offer.description}
              </p>
            )}
          </div>

          {/* Requirements & Limits Breakdown */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-background/50 p-3 text-caption">
            <div>
              <span className="text-faint block text-[10px] uppercase font-bold">Min Order</span>
              <span className="font-display font-bold text-foreground">
                {offer.minOrderValue > 0 ? `₹${offer.minOrderValue}` : "No min"}
              </span>
            </div>
            <div>
              <span className="text-faint block text-[10px] uppercase font-bold">Max Discount</span>
              <span className="font-display font-bold text-foreground">
                {offer.maxDiscount ? `₹${offer.maxDiscount}` : "Unlimited"}
              </span>
            </div>
            <div>
              <span className="text-faint block text-[10px] uppercase font-bold">Total Redemptions</span>
              <span className="font-display font-bold text-primary">
                {offer.usageCount} {offer.usageLimit ? `/ ${offer.usageLimit}` : ""}
              </span>
            </div>
            <div>
              <span className="text-faint block text-[10px] uppercase font-bold">Total Savings</span>
              <span className="font-display font-bold text-emerald-400">
                ₹{offer.totalDiscountGiven}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Toggle Switch & Date Info */}
        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
          <div className="flex flex-col text-[11px] text-faint">
            {offer.expiresAtIso ? (
              <span>Valid till {new Date(offer.expiresAtIso).toLocaleDateString()}</span>
            ) : (
              <span>No expiration date</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-display text-caption font-bold text-muted">
              {offer.isActive ? "Active" : "Paused"}
            </span>
            <button
              type="button"
              onClick={() => onToggleActive(offer.id, !offer.isActive)}
              disabled={isExpired}
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                offer.isActive ? "bg-primary" : "bg-border"
              } ${isExpired ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  offer.isActive ? "right-0.5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-2xl text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </div>
            <h3 className="font-display text-heading font-extrabold text-foreground">
              Delete Coupon "{offer.code}"?
            </h3>
            <p className="mt-1 font-body text-caption text-faint">
              Students will no longer be able to redeem this coupon code at checkout.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-border bg-surface-elevated py-3 font-display text-caption font-bold text-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-danger py-3 font-display text-caption font-bold uppercase tracking-wider text-white shadow-lg shadow-danger/20 hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
