"use client";

import { useState } from "react";
import type { VendorStoreSettingsData } from "@/lib/supabase/vendor_settings";

export interface VendorStoreStatusSectionProps {
  currentStatus: VendorStoreSettingsData["status"];
  onSaveStatus: (status: VendorStoreSettingsData["status"]) => Promise<void>;
}

export function VendorStoreStatusSection({
  currentStatus,
  onSaveStatus,
}: VendorStoreStatusSectionProps) {
  const [selectedStatus, setSelectedStatus] = useState<VendorStoreSettingsData["status"]>(currentStatus);
  const [isSaving, setIsSaving] = useState(false);

  const statuses: Array<{
    id: VendorStoreSettingsData["status"];
    title: string;
    description: string;
    icon: string;
    badgeColor: string;
  }> = [
    {
      id: "active",
      title: "OPEN (Accepting Orders)",
      description: "Canteen is open for student orders and immediate food preparation.",
      icon: "check_circle",
      badgeColor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    },
    {
      id: "busy",
      title: "BUSY (High Demand / Buffer)",
      description: "Canteen is experiencing high order volume. Extra prep buffer added.",
      icon: "warning",
      badgeColor: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    },
    {
      id: "closed",
      title: "CLOSED (Temporarily Stopped)",
      description: "Canteen is closed. Students cannot place new orders on the storefront.",
      icon: "do_not_disturb_on",
      badgeColor: "border-danger/40 bg-danger/10 text-danger",
    },
  ];

  const handleStatusChange = async (newSt: VendorStoreSettingsData["status"]) => {
    setSelectedStatus(newSt);
    setIsSaving(true);
    await onSaveStatus(newSt);
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface-elevated p-6 shadow-lg">
      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Store Availability & Status
          </h3>
          <p className="text-caption text-muted">
            Controls whether students can place orders on the GRABIT app
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 font-display text-caption font-extrabold uppercase tracking-wider border ${
            statuses.find((s) => s.id === currentStatus)?.badgeColor
          }`}
        >
          Current: {currentStatus}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {statuses.map((st) => {
          const isSelected = selectedStatus === st.id;
          return (
            <button
              key={st.id}
              type="button"
              disabled={isSaving}
              onClick={() => handleStatusChange(st.id)}
              className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                isSelected
                  ? `${st.badgeColor} border-2 shadow-lg`
                  : "border-border/60 bg-background/50 hover:bg-background"
              }`}
            >
              <span className="material-symbols-outlined text-[24px] shrink-0 mt-0.5">
                {st.icon}
              </span>
              <div className="flex flex-col">
                <span className="font-display text-body-sm font-bold">
                  {st.title}
                </span>
                <span className="text-caption text-muted mt-0.5">
                  {st.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
