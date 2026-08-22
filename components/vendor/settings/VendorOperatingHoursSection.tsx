"use client";

import { useState } from "react";
import type { VendorStoreSettingsData } from "@/lib/supabase/vendor_settings";

export interface VendorOperatingHoursSectionProps {
  openingTime: string;
  closingTime: string;
  operatingDays: string;
  onSave: (payload: {
    openingTime: string;
    closingTime: string;
    operatingDays: string;
  }) => Promise<void>;
}

export function VendorOperatingHoursSection({
  openingTime: initialOpen,
  closingTime: initialClose,
  operatingDays: initialDays,
  onSave,
}: VendorOperatingHoursSectionProps) {
  const [openingTime, setOpeningTime] = useState(initialOpen);
  const [closingTime, setClosingTime] = useState(initialClose);
  const [operatingDays, setOperatingDays] = useState(initialDays);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave({
      openingTime: openingTime.trim(),
      closingTime: closingTime.trim(),
      operatingDays: operatingDays.trim(),
    });
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-border bg-surface-elevated p-6 shadow-lg">
      <div className="border-b border-border/60 pb-3">
        <h3 className="font-display text-title font-bold text-foreground">
          Operating Hours Schedule
        </h3>
        <p className="text-caption text-muted">
          Daily store opening and closing times displayed to students
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-display text-caption font-bold text-muted">
            Daily Opening Time
          </label>
          <input
            type="text"
            required
            value={openingTime}
            onChange={(e) => setOpeningTime(e.target.value)}
            placeholder="e.g. 08:00 AM"
            className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none font-mono"
          />
        </div>

        <div>
          <label className="mb-1 block font-display text-caption font-bold text-muted">
            Daily Closing Time
          </label>
          <input
            type="text"
            required
            value={closingTime}
            onChange={(e) => setClosingTime(e.target.value)}
            placeholder="e.g. 08:00 PM"
            className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none font-mono"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-display text-caption font-bold text-muted">
          Operating Days
        </label>
        <input
          type="text"
          required
          value={operatingDays}
          onChange={(e) => setOperatingDays(e.target.value)}
          placeholder="e.g. Monday - Saturday"
          className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-primary px-6 py-3 font-display text-body-sm font-extrabold text-on-primary shadow-glow-primary hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Operating Hours"}
        </button>
      </div>
    </form>
  );
}
