"use client";

import Link from "next/link";

export function VendorNotificationPreferencesSection() {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface-elevated p-6 shadow-lg">
      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Notification Preferences
          </h3>
          <p className="text-caption text-muted">
            Integrated with the GRABIT Notifications Center
          </p>
        </div>
        <span className="material-symbols-outlined text-primary text-[24px]">notifications</span>
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 flex flex-col gap-2">
        <span className="font-display font-bold text-primary text-body-sm">
          Unified Notification Control Center
        </span>
        <p className="text-caption text-foreground/90 leading-relaxed">
          Operational alert preferences for order placements, low stock, daily settlements, low-rating review alerts, and system announcements are managed in the central Notifications module.
        </p>
        <div className="pt-2">
          <Link
            href="/vendor/notifications"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-display text-caption font-bold text-on-primary shadow-glow-primary hover:opacity-90 transition-all"
          >
            <span>Open Notification Preferences</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
