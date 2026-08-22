"use client";

import { useState } from "react";
import type { VendorOffer } from "@/lib/supabase/vendor_offers";

export interface VendorCreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    id?: string;
    code: string;
    description?: string;
    discountType: "PERCENTAGE" | "FLAT";
    discountValue: number;
    maxDiscount?: number;
    minOrderValue?: number;
    usageLimit?: number;
    perUserLimit?: number;
    startsAt?: string;
    expiresAt?: string;
    isActive?: boolean;
  }) => Promise<void>;
  editingOffer: VendorOffer | null;
}

export function VendorCreateOfferModal({
  isOpen,
  onClose,
  onSave,
  editingOffer,
}: VendorCreateOfferModalProps) {
  const [code, setCode] = useState(editingOffer?.code ?? "");
  const [description, setDescription] = useState(editingOffer?.description ?? "");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT">(
    editingOffer?.discountType ?? "PERCENTAGE",
  );
  const [discountValue, setDiscountValue] = useState(
    editingOffer ? String(editingOffer.discountValue) : "15",
  );
  const [maxDiscount, setMaxDiscount] = useState(
    editingOffer?.maxDiscount ? String(editingOffer.maxDiscount) : "",
  );
  const [minOrderValue, setMinOrderValue] = useState(
    editingOffer ? String(editingOffer.minOrderValue) : "199",
  );
  const [usageLimit, setUsageLimit] = useState(
    editingOffer?.usageLimit ? String(editingOffer.usageLimit) : "",
  );
  const [perUserLimit, setPerUserLimit] = useState(
    editingOffer ? String(editingOffer.perUserLimit) : "1",
  );
  const [expiresAt, setExpiresAt] = useState(
    editingOffer?.expiresAtIso
      ? new Date(editingOffer.expiresAtIso).toISOString().slice(0, 10)
      : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAutoGenerateCode = () => {
    const prefixes = ["GRAB", "YUM", "MEAL", "CAMPUS", "DEAL", "FEAST"];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(10 + Math.random() * 90);
    setCode(`${randomPrefix}${randomNum}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg("Coupon code is required.");
      return;
    }

    const valNum = Number(discountValue);
    if (isNaN(valNum) || valNum <= 0) {
      setErrorMsg("Discount value must be greater than 0.");
      return;
    }

    if (discountType === "PERCENTAGE" && valNum > 100) {
      setErrorMsg("Percentage discount cannot exceed 100%.");
      return;
    }

    setIsSubmitting(true);
    await onSave({
      id: editingOffer?.id,
      code: cleanCode,
      description: description.trim(),
      discountType,
      discountValue: valNum,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      perUserLimit: perUserLimit ? Number(perUserLimit) : 1,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      isActive: editingOffer ? editingOffer.isActive : true,
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl my-8">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-display text-title font-bold text-foreground">
            {editingOffer ? "Edit Promotional Offer" : "Create New Offer"}
          </h3>
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
          <div className="mb-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-caption font-semibold text-danger">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Coupon Code Row */}
          <div>
            <label className="mb-1 block font-display text-caption font-bold text-muted">
              Coupon Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. GRABIT50"
                className="flex-1 rounded-xl border border-border bg-background p-3 font-mono text-body-sm font-bold tracking-wider text-foreground uppercase focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAutoGenerateCode}
                className="rounded-xl border border-border bg-background px-4 py-3 font-display text-caption font-bold text-primary hover:border-primary/40 hover:bg-primary/10 transition-colors shrink-0"
              >
                Auto Generate
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block font-display text-caption font-bold text-muted">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Get 15% off your lunchtime meal"
              className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
            />
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-display text-caption font-bold text-muted">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FLAT")}
                className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-display text-caption font-bold text-muted">
                {discountType === "PERCENTAGE" ? "Discount (%)" : "Discount Amount (₹)"}
              </label>
              <input
                type="number"
                required
                min="1"
                max={discountType === "PERCENTAGE" ? "100" : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Min Order & Max Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-display text-caption font-bold text-muted">
                Min Order Value (₹)
              </label>
              <input
                type="number"
                min="0"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-display text-caption font-bold text-muted">
                Max Discount Cap (₹)
              </label>
              <input
                type="number"
                min="1"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                placeholder="Optional (e.g. 100)"
                className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Usage Limit & Expiration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block font-display text-caption font-bold text-muted">
                Total Redemptions Limit
              </label>
              <input
                type="number"
                min="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="Unlimited"
                className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-display text-caption font-bold text-muted">
                Per-User Limit
              </label>
              <input
                type="number"
                min="1"
                value={perUserLimit}
                onChange={(e) => setPerUserLimit(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-display text-caption font-bold text-muted">
                Expiration Date
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Offer Preview Box */}
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4">
            <span className="font-display text-[10px] font-bold uppercase tracking-wider text-primary">
              Live Offer Preview
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-display text-title font-extrabold text-foreground">
                {discountType === "PERCENTAGE"
                  ? `${discountValue || 0}% OFF`
                  : `₹${discountValue || 0} OFF`}
              </span>
              <span className="font-mono text-body-sm font-bold text-primary">
                {code || "CODE"}
              </span>
            </div>
            <p className="mt-1 text-caption text-muted">
              Min order ₹{minOrderValue || 0}
              {maxDiscount ? ` • Max discount ₹${maxDiscount}` : ""}
              {expiresAt ? ` • Expires ${expiresAt}` : ""}
            </p>
          </div>

          {/* Submit Actions */}
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-border bg-background py-3 font-display text-body-sm font-bold text-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-primary py-3 font-display text-body-sm font-bold text-on-primary shadow-glow-primary hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : editingOffer
                  ? "Save Offer Changes"
                  : "Publish Offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
