"use client";

import { useEffect, useState } from "react";
import type { VendorStoreConfig } from "@/lib/mock/vendor";
import { createClient } from "@/lib/supabase/client";

interface VendorProfile {
  vendorId: string;
  shopName: string | null;
  shopDescription: string | null;
  shopImageUrl: string | null;
  storeStatus: string | null;
  email: string | null;
  phone: string | null;
  registeredAt: string | null;
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="font-display text-caption font-bold text-muted">{label}</span>
      <span className="max-w-[60%] truncate text-right text-body-sm text-foreground">{value}</span>
    </div>
  );
}

export function VendorProfileSheet({
  isOpen,
  onClose,
  store,
}: {
  isOpen: boolean;
  onClose: () => void;
  store: VendorStoreConfig;
}) {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/vendor/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setProfile(d.profile);
          setShopName(d.profile.shopName ?? "");
          setDescription(d.profile.shopDescription ?? "");
        }
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName, shopDescription: description }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Unable to save.");
        return;
      }
      setProfile((p) => (p ? { ...p, shopName, shopDescription: description } : p));
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setIsSavingPassword(true);
    try {
      const supabase = createClient();
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) {
        setPasswordError("Unable to change password. Please try again.");
        return;
      }
      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const registeredLabel = profile?.registeredAt
    ? new Date(profile.registeredAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
    : null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-3xl border border-border bg-[#121212] shadow-2xl sm:max-h-[80vh] sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h3 className="font-display text-title font-bold text-foreground">Vendor Profile</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-faint hover:bg-surface-elevated hover:text-foreground"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {!profile ? (
          <div className="flex flex-1 items-center justify-center p-10">
            <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
              progress_activity
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-6 overflow-y-auto p-5">
            <section>
              <h4 className="mb-1 font-display text-[11px] font-extrabold uppercase tracking-widest text-faint">
                Store Information
              </h4>
              <div className="divide-y divide-border/40 rounded-xl border border-border bg-surface-elevated px-4">
                {isEditing ? (
                  <div className="flex flex-col gap-3 py-3">
                    <input
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="Shop name"
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-body-sm text-foreground focus:border-primary focus:outline-none"
                    />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Shop description"
                      rows={2}
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-body-sm text-foreground focus:border-primary focus:outline-none resize-none"
                    />
                    {error && <p className="text-caption font-semibold text-danger">{error}</p>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 rounded-lg border border-border py-2 font-display text-caption font-bold text-muted"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleSave}
                        className="flex-1 rounded-lg bg-primary py-2 font-display text-caption font-bold text-on-primary disabled:opacity-50"
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Field label="Shop Name" value={profile.shopName} />
                    <Field label="Description" value={profile.shopDescription} />
                    <Field label="Store Status" value={store.isOpen ? "Open" : "Closed"} />
                    <Field label="Prep Time" value={`${store.prepTimeMinutes} min`} />
                  </>
                )}
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="mt-2 font-display text-caption font-bold text-primary hover:text-primary-soft"
                >
                  Edit shop details
                </button>
              )}
            </section>

            <section>
              <h4 className="mb-1 font-display text-[11px] font-extrabold uppercase tracking-widest text-faint">
                Contact Information
              </h4>
              <div className="divide-y divide-border/40 rounded-xl border border-border bg-surface-elevated px-4">
                <Field label="Email" value={profile.email} />
                <Field label="Phone" value={profile.phone} />
              </div>
            </section>

            <section>
              <h4 className="mb-1 font-display text-[11px] font-extrabold uppercase tracking-widest text-faint">
                Account
              </h4>
              <div className="divide-y divide-border/40 rounded-xl border border-border bg-surface-elevated px-4">
                <Field label="Vendor ID" value={profile.vendorId} />
                <Field label="Registered On" value={registeredLabel} />
              </div>
            </section>

            <section>
              <h4 className="mb-1 font-display text-[11px] font-extrabold uppercase tracking-widest text-faint">
                Account Settings
              </h4>
              <div className="rounded-xl border border-border bg-surface-elevated p-4">
                {isChangingPassword ? (
                  <div className="flex flex-col gap-3">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-body-sm text-foreground focus:border-primary focus:outline-none"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-body-sm text-foreground focus:border-primary focus:outline-none"
                    />
                    {passwordError && <p className="text-caption font-semibold text-danger">{passwordError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordError(null);
                        }}
                        className="flex-1 rounded-lg border border-border py-2 font-display text-caption font-bold text-muted"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSavingPassword}
                        onClick={handleChangePassword}
                        className="flex-1 rounded-lg bg-primary py-2 font-display text-caption font-bold text-on-primary disabled:opacity-50"
                      >
                        {isSavingPassword ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(true);
                      setPasswordSuccess(false);
                    }}
                    className="font-display text-caption font-bold text-primary hover:text-primary-soft"
                  >
                    Change Password
                  </button>
                )}
                {passwordSuccess && (
                  <p className="mt-2 text-caption font-semibold text-success">Password updated successfully.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
