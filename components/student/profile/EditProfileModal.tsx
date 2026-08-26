"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFullName: string;
  currentPhone: string;
  currentEmail: string;
  currentAvatarUrl: string;
  grabitUserId: string;
  onSave: (payload: { fullName: string; phone: string; avatarUrl: string }) => Promise<void>;
}

export function EditProfileModal({
  isOpen,
  onClose,
  currentFullName,
  currentPhone,
  currentEmail,
  currentAvatarUrl,
  grabitUserId,
  onSave,
}: EditProfileModalProps) {
  const [fullName, setFullName] = useState(currentFullName);
  const [phone, setPhone] = useState(currentPhone);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [avatarPreview, setAvatarPreview] = useState(currentAvatarUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local form state when modal is opened with new props
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFullName(currentFullName);
    setPhone(currentPhone);
    setAvatarUrl(currentAvatarUrl);
    setAvatarPreview(currentAvatarUrl);
    setError(null);
  }, [currentFullName, currentPhone, currentAvatarUrl, isOpen]);

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a JPEG, PNG, or WebP image.");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be under 5MB.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAvatarPreview(dataUrl);
      setAvatarUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Full Name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl,
      });
      onClose();
    } catch {
      setError("We couldn't update your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border-subtle bg-surface-elevated p-6 pb-[max(1.5rem,var(--safe-area-inset-bottom,0px))] sm:pb-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">
              account_circle
            </span>
            <h3 className="font-display text-title font-bold text-foreground">
              Edit Customer Profile
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:text-foreground active:scale-95"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-caption font-medium text-danger">
              {error}
            </div>
          )}

          {/* Profile Photo Preview & Change */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-20 w-20 rounded-full border-2 border-primary p-0.5 overflow-hidden">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Profile Preview"
                  width={80}
                  height={80}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-background text-primary">
                  <span className="material-symbols-outlined text-[32px]">person</span>
                </div>
              )}
            </div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-background px-3 py-1.5 text-caption font-bold text-primary hover:border-primary">
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              Change Photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Permanent Read-Only GRABIT User ID */}
          <div>
            <label className="block text-caption font-bold text-muted mb-1">
              GRABIT User ID (Permanent)
            </label>
            <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-background/50 px-3.5 py-2.5 text-body-sm font-mono font-bold text-primary">
              <span>{grabitUserId}</span>
              <span className="material-symbols-outlined text-[18px] text-muted" title="System Generated Permanent ID">
                lock
              </span>
            </div>
            <p className="mt-1 text-[11px] text-faint">
              Permanent unique ID assigned to your account. Non-editable.
            </p>
          </div>

          {/* Full Name Input */}
          <div>
            <label htmlFor="edit-fullname" className="block text-caption font-bold text-muted mb-1">
              Full Name
            </label>
            <input
              id="edit-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Grabit Customer"
              required
              className="w-full rounded-xl border border-border-subtle bg-background px-3.5 py-2.5 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
            />
          </div>

          {/* Phone Number Input */}
          <div>
            <label htmlFor="edit-phone" className="block text-caption font-bold text-muted mb-1">
              Phone Number
            </label>
            <input
              id="edit-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-border-subtle bg-background px-3.5 py-2.5 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
            />
          </div>

          {/* Email (Read-Only Authentication Email) */}
          <div>
            <label className="block text-caption font-bold text-muted mb-1">
              Account Email
            </label>
            <input
              type="email"
              value={currentEmail}
              disabled
              className="w-full rounded-xl border border-border-subtle bg-background/40 px-3.5 py-2.5 text-body-sm text-muted cursor-not-allowed"
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2 text-caption font-bold text-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-caption font-bold text-on-primary shadow-glow-primary transition-transform active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
