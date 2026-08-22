"use client";

import { useState } from "react";

export interface VendorStorefrontSectionProps {
  announcementMessage: string;
  cuisineTags: string;
  onSave: (payload: { announcementMessage: string; cuisineTags: string }) => Promise<void>;
}

export function VendorStorefrontSection({
  announcementMessage: initialMsg,
  cuisineTags: initialTags,
  onSave,
}: VendorStorefrontSectionProps) {
  const [announcementMessage, setAnnouncementMessage] = useState(initialMsg);
  const [cuisineTags, setCuisineTags] = useState(initialTags);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave({
      announcementMessage: announcementMessage.trim(),
      cuisineTags: cuisineTags.trim(),
    });
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-border bg-surface-elevated p-6 shadow-lg">
      <div className="border-b border-border/60 pb-3">
        <h3 className="font-display text-title font-bold text-foreground">
          Storefront Banner & Announcement
        </h3>
        <p className="text-caption text-muted">
          Special banner message and cuisine tags displayed to students browsing your canteen
        </p>
      </div>

      <div>
        <label className="mb-1 block font-display text-caption font-bold text-muted">
          Storefront Announcement Message
        </label>
        <textarea
          rows={3}
          value={announcementMessage}
          onChange={(e) => setAnnouncementMessage(e.target.value)}
          placeholder="e.g. 🔥 Fresh South Indian Dosa & Combos available now!"
          className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
        />
        <span className="text-[11px] text-faint block mt-1">
          Appears at the top of your canteen menu page for all campus students.
        </span>
      </div>

      <div>
        <label className="mb-1 block font-display text-caption font-bold text-muted">
          Cuisine Tags (Comma Separated)
        </label>
        <input
          type="text"
          value={cuisineTags}
          onChange={(e) => setCuisineTags(e.target.value)}
          placeholder="e.g. Fast Food, Indian, Beverages, Chinese"
          className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-primary px-6 py-3 font-display text-body-sm font-extrabold text-on-primary shadow-glow-primary hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Storefront Settings"}
        </button>
      </div>
    </form>
  );
}
