"use client";

import type { CampusVendorHub, VendorOversightItem } from "@/lib/mock/superadmin";
import { VendorOversightCard } from "@/components/superadmin/vendors/VendorOversightCard";

interface VendorHubGroupProps {
  hub: CampusVendorHub;
  onUpdateCommission: (vendorId: string, commission: number) => void;
  onToggleTier: (vendorId: string, tier: "STD" | "PREM") => void;
  onMoreActions: (vendor: VendorOversightItem) => void;
}

export function VendorHubGroup({
  hub,
  onUpdateCommission,
  onToggleTier,
  onMoreActions,
}: VendorHubGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Hub Header */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">
            {hub.icon}
          </span>
          <h3 className="font-display text-title font-bold text-foreground">
            {hub.hubName}
          </h3>
        </div>
        <span className="font-display text-caption font-semibold text-faint">
          {hub.vendors.length} Active Vendors
        </span>
      </div>

      {/* Vendor List */}
      <div className="flex flex-col gap-3">
        {hub.vendors.map((vendor) => (
          <VendorOversightCard
            key={vendor.id}
            vendor={vendor}
            onUpdateCommission={onUpdateCommission}
            onToggleTier={onToggleTier}
            onMoreActions={onMoreActions}
          />
        ))}
      </div>
    </div>
  );
}
