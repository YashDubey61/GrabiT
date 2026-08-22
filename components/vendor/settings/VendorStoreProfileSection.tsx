"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { VendorStoreSettingsData } from "@/lib/supabase/vendor_settings";

export interface VendorStoreProfileSectionProps {
  data: VendorStoreSettingsData;
  onSave: (payload: Partial<VendorStoreSettingsData>) => Promise<void>;
}

export function VendorStoreProfileSection({
  data,
  onSave,
}: VendorStoreProfileSectionProps) {
  const [name, setName] = useState(data.name);
  const [description, setDescription] = useState(data.description);
  const [category, setCategory] = useState(data.category);
  const [phone, setPhone] = useState(data.phone);
  const [email, setEmail] = useState(data.email);
  const [imageUrl, setImageUrl] = useState(data.imageUrl);

  const [isSaving, setIsSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setName(data.name);
    setDescription(data.description);
    setCategory(data.category);
    setPhone(data.phone);
    setEmail(data.email);
    setImageUrl(data.imageUrl);
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      phone: phone.trim(),
      email: email.trim(),
      imageUrl: imageUrl.trim(),
    });
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-border bg-surface-elevated p-6 shadow-lg">
      <div className="border-b border-border/60 pb-3">
        <h3 className="font-display text-title font-bold text-foreground">
          Store Profile Settings
        </h3>
        <p className="text-caption text-muted">
          Public canteen name, logo thumbnail, description, and contact details
        </p>
      </div>

      {/* Logo Image Preview */}
      <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-background/50 p-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-black border border-border">
          {!imgError && imageUrl ? (
            <Image
              src={imageUrl}
              alt="Canteen Logo"
              fill
              onError={() => setImgError(true)}
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[28px]">storefront</span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <label className="mb-1 block font-display text-caption font-bold text-muted">
            Logo Image URL
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              setImgError(false);
            }}
            placeholder="https://..."
            className="w-full rounded-xl border border-border bg-background p-2.5 text-body-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-display text-caption font-bold text-muted">
            Canteen / Store Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-background p-3 text-body-sm font-bold text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block font-display text-caption font-bold text-muted">
            Canteen Category / Food Type
          </label>
          <input
            type="text"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-display text-caption font-bold text-muted">
          Store Description
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your canteen specialties, hygiene standards, and quick options..."
          className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block font-display text-caption font-bold text-muted">
            Contact Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block font-display text-caption font-bold text-muted">
            Contact Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vendor@campus.edu"
            className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-primary px-6 py-3 font-display text-body-sm font-extrabold text-on-primary shadow-glow-primary hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Store Profile"}
        </button>
      </div>
    </form>
  );
}
