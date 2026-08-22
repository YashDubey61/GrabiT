"use client";

import { useState } from "react";
import type { VendorInventoryItem } from "@/lib/supabase/vendor_inventory";

export interface VendorStockAdjustModalProps {
  item: VendorInventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    menuItemId: string;
    quantityDelta?: number;
    exactQuantity?: number;
    adjustmentType?: string;
    reason?: string;
  }) => Promise<void>;
}

export function VendorStockAdjustModal({
  item,
  isOpen,
  onClose,
  onConfirm,
}: VendorStockAdjustModalProps) {
  const [mode, setMode] = useState<"add" | "remove" | "set">("add");
  const [quantity, setQuantity] = useState("10");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 0) return;

    setIsSubmitting(true);

    let payload: {
      menuItemId: string;
      quantityDelta?: number;
      exactQuantity?: number;
      adjustmentType?: string;
      reason?: string;
    };

    if (mode === "set") {
      payload = {
        menuItemId: item.id,
        exactQuantity: qtyNum,
        adjustmentType: "manual_correction",
        reason: reason.trim() || "Manual quantity override",
      };
    } else if (mode === "add") {
      payload = {
        menuItemId: item.id,
        quantityDelta: qtyNum,
        adjustmentType: "stock_added",
        reason: reason.trim() || "Restock added",
      };
    } else {
      payload = {
        menuItemId: item.id,
        quantityDelta: -qtyNum,
        adjustmentType: "stock_removed",
        reason: reason.trim() || "Stock removed",
      };
    }

    await onConfirm(payload);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-display text-title font-bold text-foreground">
              Adjust Stock: {item.name}
            </h3>
            <p className="text-caption text-muted">
              Current Stock: <span className="font-bold text-primary">{item.stockQuantity} units</span>
            </p>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Action Mode Pills */}
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-background p-1 border border-border">
            <button
              type="button"
              onClick={() => setMode("add")}
              className={`rounded-lg py-2 font-display text-caption font-bold transition-all ${
                mode === "add"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              + Add Stock
            </button>
            <button
              type="button"
              onClick={() => setMode("remove")}
              className={`rounded-lg py-2 font-display text-caption font-bold transition-all ${
                mode === "remove"
                  ? "bg-danger text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              - Remove
            </button>
            <button
              type="button"
              onClick={() => setMode("set")}
              className={`rounded-lg py-2 font-display text-caption font-bold transition-all ${
                mode === "set"
                  ? "bg-surface text-foreground border border-border"
                  : "text-muted hover:text-foreground"
              }`}
            >
              = Set Exact
            </button>
          </div>

          {/* Quick Preset Badges */}
          {mode !== "set" && (
            <div className="flex gap-2">
              {[5, 10, 25, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuantity(String(preset))}
                  className="flex-1 rounded-xl border border-border bg-background py-1.5 font-display text-caption font-bold text-muted hover:border-primary/40 hover:text-primary transition-colors"
                >
                  {mode === "add" ? `+${preset}` : `-${preset}`}
                </button>
              ))}
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <label className="mb-1 block font-display text-caption font-bold text-muted">
              {mode === "add"
                ? "Units to Add"
                : mode === "remove"
                  ? "Units to Remove"
                  : "New Exact Stock Quantity"}
            </label>
            <input
              type="number"
              required
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-3 font-mono text-title font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Adjustment Reason */}
          <div>
            <label className="mb-1 block font-display text-caption font-bold text-muted">
              Reason (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Daily morning delivery restock"
              className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
            />
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
              className={`flex-1 rounded-xl py-3 font-display text-body-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                mode === "remove"
                  ? "bg-danger text-white shadow-danger/20"
                  : "bg-primary text-on-primary shadow-glow-primary"
              }`}
            >
              {isSubmitting ? "Updating..." : "Confirm Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
