"use client";

import type { VendorStoreSettingsData } from "@/lib/supabase/vendor_settings";

export interface VendorSecurityAccountSectionProps {
  data: VendorStoreSettingsData;
}

export function VendorSecurityAccountSection({
  data,
}: VendorSecurityAccountSectionProps) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface-elevated p-6 shadow-lg">
      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Vendor Account & Security
          </h3>
          <p className="text-caption text-muted">
            Authenticated manager credentials and institutional campus scope
          </p>
        </div>
        <span className="material-symbols-outlined text-primary text-[24px]">shield_person</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <span className="text-caption text-faint block">Manager Name</span>
          <span className="font-display text-body-sm font-bold text-foreground">
            {data.account.fullName}
          </span>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <span className="text-caption text-faint block">Login Email</span>
          <span className="font-display text-body-sm font-bold text-foreground">
            {data.account.email}
          </span>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <span className="text-caption text-faint block">Account Role</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-display text-body-sm font-bold text-primary">
              {data.account.role}
            </span>
            <span className="rounded-md bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 font-display text-[10px] font-extrabold uppercase">
              Authenticated
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <span className="text-caption text-faint block">Campus Scope</span>
          <span className="font-display text-body-sm font-bold text-foreground">
            {data.campusName}
          </span>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <span className="text-caption text-faint block">Canteen ID</span>
          <span className="font-mono text-caption font-bold text-muted break-all">
            {data.canteenId}
          </span>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <span className="text-caption text-faint block">Commission Tier</span>
          <span className="font-display text-body-sm font-bold text-amber-400">
            {data.tier} ({data.commissionRate}% Commission)
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border/40 bg-background/30 p-3 text-caption text-faint flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">lock</span>
        <span>
          Role permissions and Canteen IDs are locked by GRABIT Security Policies and cannot be modified from client settings.
        </span>
      </div>
    </div>
  );
}
