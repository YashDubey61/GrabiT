"use client";

import { useState, useEffect } from "react";
import type { VendorNotificationPreferences } from "@/lib/supabase/vendor_notifications_center";
import { useModalBackHandler } from "@/lib/navigation/backButtonManager";

export interface VendorNotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePreferences: (prefs: VendorNotificationPreferences) => void;
}

export function VendorNotificationPreferencesModal({
  isOpen,
  onClose,
  onSavePreferences,
}: VendorNotificationPreferencesModalProps) {
  useModalBackHandler(isOpen, onClose, "vendor-notification-preferences-modal");
  const [prefs, setPrefs] = useState<VendorNotificationPreferences>({
    orderAlerts: true,
    inventoryAlerts: true,
    payoutAlerts: true,
    reviewAlerts: true,
    systemAnnouncements: true,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("grabit_vendor_notif_prefs");
      if (stored) {
        setPrefs(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  if (!isOpen) return null;

  const handleToggle = (key: keyof VendorNotificationPreferences) => {
    if (key === "systemAnnouncements") return; // Platform security rules require system announcements
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
  };

  const handleSave = () => {
    try {
      localStorage.setItem("grabit_vendor_notif_prefs", JSON.stringify(prefs));
    } catch {
      // Ignore
    }
    onSavePreferences(prefs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-display text-title font-bold text-foreground">
              Notification Preferences
            </h3>
            <p className="text-caption text-muted">
              Choose which operational alerts to receive
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

        <div className="flex flex-col gap-3">
          {[
            {
              key: "orderAlerts",
              title: "Order Alerts",
              desc: "New order placements, cancellations, SLA warnings",
            },
            {
              key: "inventoryAlerts",
              title: "Inventory Alerts",
              desc: "Low stock, out-of-stock items, restock reminders",
            },
            {
              key: "payoutAlerts",
              title: "Payment & Payout Alerts",
              desc: "Settlements, 6 PM daily payouts, payment holds",
            },
            {
              key: "reviewAlerts",
              title: "Customer Review Alerts",
              desc: "New reviews, 1-star & 2-star rating alerts",
            },
            {
              key: "systemAnnouncements",
              title: "System & Platform Announcements",
              desc: "Mandatory security notices, platform updates (Required)",
              mandatory: true,
            },
          ].map((item) => {
            const isChecked = prefs[item.key as keyof VendorNotificationPreferences];
            return (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 p-3"
              >
                <div className="flex flex-col">
                  <span className="font-display text-body-sm font-bold text-foreground">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-faint">{item.desc}</span>
                </div>

                <button
                  type="button"
                  disabled={item.mandatory}
                  onClick={() => handleToggle(item.key as keyof VendorNotificationPreferences)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isChecked ? "bg-primary" : "bg-border"
                  } ${item.mandatory ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      isChecked ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-background py-3 font-display text-body-sm font-bold text-muted hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-xl bg-primary py-3 font-display text-body-sm font-bold text-on-primary shadow-glow-primary hover:opacity-90 active:scale-95"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
