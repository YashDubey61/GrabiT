"use client";

import Link from "next/link";
import type { VendorStoreSettingsData } from "@/lib/supabase/vendor_settings";

export interface VendorPayoutAccountSectionProps {
  payoutAccount: VendorStoreSettingsData["payoutAccount"];
}

export function VendorPayoutAccountSection({
  payoutAccount,
}: VendorPayoutAccountSectionProps) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface-elevated p-6 shadow-lg">
      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Bank Payout Account
          </h3>
          <p className="text-caption text-muted">
            Designated account for 6:00 PM IST daily automated settlements
          </p>
        </div>
        <span className="material-symbols-outlined text-emerald-400 text-[24px]">account_balance</span>
      </div>

      {payoutAccount.isConfigured ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <span className="text-caption text-faint block">Bank Name</span>
            <span className="font-display text-body-sm font-bold text-foreground">
              {payoutAccount.bankName}
            </span>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <span className="text-caption text-faint block">Account Number</span>
            <span className="font-mono text-body-sm font-bold text-primary">
              {payoutAccount.maskedAccountNumber}
            </span>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <span className="text-caption text-faint block">IFSC Code</span>
            <span className="font-mono text-body-sm font-bold text-foreground">
              {payoutAccount.ifscCode}
            </span>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/50 p-3 flex items-center justify-between">
            <span className="text-caption text-faint block">Status</span>
            <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 font-display text-[10px] font-extrabold uppercase">
              Verified
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <span className="font-display text-body-sm font-bold text-foreground block">
            No Payout Bank Account Configured
          </span>
          <p className="text-caption text-muted mt-0.5">
            Configure your bank details to receive automated 6 PM daily payouts.
          </p>
        </div>
      )}

      <div className="pt-2 flex justify-end">
        <Link
          href="/vendor/payouts"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2.5 font-display text-body-sm font-bold text-primary hover:border-primary/40 transition-all"
        >
          <span>Manage Payout Account & Settlements</span>
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
        </Link>
      </div>
    </div>
  );
}
