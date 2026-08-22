"use client";

import type { VendorOversightItem } from "@/lib/mock/superadmin";

interface VendorOversightCardProps {
  vendor: VendorOversightItem;
  onUpdateCommission: (vendorId: string, commission: number) => void;
  onToggleTier: (vendorId: string, tier: "STD" | "PREM") => void;
  onMoreActions: (vendor: VendorOversightItem) => void;
}

export function VendorOversightCard({
  vendor,
  onUpdateCommission,
  onToggleTier,
  onMoreActions,
}: VendorOversightCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-elevated/80 p-4 backdrop-blur-md transition-all sm:flex-row sm:items-center sm:justify-between hover:border-primary/40">
      {/* Icon & Details */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-sunken text-primary border border-border">
          <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
            {vendor.icon}
          </span>
        </div>
        <div>
          <h4 className="font-display text-body font-bold text-foreground">
            {vendor.name}
          </h4>
          <p className="text-caption text-faint">{vendor.category}</p>
        </div>
      </div>

      {/* Controls: Commission & Tier */}
      <div className="flex items-center gap-4 justify-between sm:justify-end">
        {/* Commission */}
        <div className="flex items-center gap-1.5">
          <span className="text-caption text-faint">Comm:</span>
          <div className="flex items-center rounded border border-border bg-background px-2 py-1 font-mono text-body-sm font-bold text-primary">
            <input
              type="text"
              value={`${vendor.commissionPercent}%`}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace("%", ""), 10);
                if (!isNaN(val)) onUpdateCommission(vendor.id, val);
              }}
              className="w-8 bg-transparent text-center focus:outline-none"
            />
          </div>
        </div>

        {/* Tier Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-caption text-faint">Tier:</span>
          <div className="flex rounded-full border border-border bg-background p-0.5">
            <button
              type="button"
              onClick={() => onToggleTier(vendor.id, "STD")}
              className={`rounded-full px-2.5 py-0.5 font-display text-[10px] font-bold transition-all ${
                vendor.tier === "STD"
                  ? "bg-primary text-on-primary"
                  : "text-faint hover:text-foreground"
              }`}
            >
              STD
            </button>
            <button
              type="button"
              onClick={() => onToggleTier(vendor.id, "PREM")}
              className={`rounded-full px-2.5 py-0.5 font-display text-[10px] font-bold transition-all ${
                vendor.tier === "PREM"
                  ? "bg-primary text-on-primary"
                  : "text-faint hover:text-foreground"
              }`}
            >
              PREM
            </button>
          </div>
        </div>

        {/* More Actions */}
        <div className="h-6 w-[1px] bg-border hidden sm:block" />
        <button
          type="button"
          onClick={() => onMoreActions(vendor)}
          aria-label="Vendor actions"
          className="rounded-lg p-1 text-faint hover:bg-surface-elevated hover:text-foreground"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            more_vert
          </span>
        </button>
      </div>
    </div>
  );
}
