"use client";

import { useEffect, useState, useCallback } from "react";
import type { VendorStoreConfig } from "@/lib/mock/vendor";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { hardNavigate } from "@/lib/auth/redirect";
import { useModalBackHandler } from "@/lib/navigation/backButtonManager";

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
  const { signOut } = useAuth();
  useModalBackHandler(isOpen, onClose, "vendor-profile-sheet");
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/vendor/profile", {
        headers: { "Cache-Control": "no-cache" },
      });
      const d = await res.json();
      if (!res.ok || !d.ok) {
        setFetchError(d.error ?? "Unable to load vendor profile.");
        setProfile(null);
        return;
      }

      // Map either d.profile or d.data fallback
      const profData: VendorProfile | null = d.profile
        ? d.profile
        : d.data
        ? {
            vendorId: d.data.canteenId,
            shopName: d.data.name,
            shopDescription: d.data.description,
            shopImageUrl: d.data.imageUrl,
            storeStatus: d.data.status,
            email: d.data.email || d.data.account?.email || null,
            phone: d.data.phone || d.data.account?.phone || null,
            registeredAt: new Date().toISOString(),
          }
        : null;

      if (profData) {
        setProfile(profData);
        setShopName(profData.shopName ?? "");
        setDescription(profData.shopDescription ?? "");
      } else {
        setFetchError("Vendor profile details not found.");
        setProfile(null);
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
      setFetchError("Unable to load profile. Please check your network connection and try again.");
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen, fetchProfile]);

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
      <div className="glass-drawer flex max-h-[85dvh] w-full max-w-md flex-col sm:max-h-[80vh]">
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

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center p-10">
            <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
              progress_activity
            </span>
          </div>
        ) : fetchError ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center space-y-3">
            <span className="material-symbols-outlined text-[36px] text-danger">error</span>
            <h4 className="font-display text-body font-bold text-foreground">Unable to Load Profile</h4>
            <p className="text-caption text-muted max-w-xs">{fetchError}</p>
            <button
              type="button"
              onClick={() => fetchProfile()}
              className="mt-2 rounded-lg bg-surface-elevated border border-border px-4 py-2 font-display text-caption font-bold text-foreground hover:bg-surface transition-colors"
            >
              Retry
            </button>
          </div>
        ) : !profile ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center space-y-3">
            <span className="material-symbols-outlined text-[36px] text-faint">storefront</span>
            <h4 className="font-display text-body font-bold text-foreground">Vendor Profile Incomplete</h4>
            <p className="text-caption text-muted max-w-xs">Your vendor store profile has not been completed yet.</p>
            <button
              type="button"
              onClick={() => fetchProfile()}
              className="mt-2 rounded-lg bg-primary px-4 py-2 font-display text-caption font-bold text-on-primary hover:bg-primary-soft transition-colors"
            >
              Retry Load
            </button>
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

            <section>
              <button
                type="button"
                disabled={isSigningOut}
                onClick={async () => {
                  setIsSigningOut(true);
                  try {
                    await signOut();
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("grabit_vendor_cache");
                    }
                  } finally {
                    setIsSigningOut(false);
                    hardNavigate("/vendor/auth");
                  }
                }}
                className="w-full rounded-xl border border-danger/40 bg-danger/10 py-3 font-display text-body-sm font-bold text-danger hover:bg-danger/20 disabled:opacity-50"
              >
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
