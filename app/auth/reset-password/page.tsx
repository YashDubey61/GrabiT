"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateUserPassword } from "@/lib/supabase/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);
    const res = await updateUserPassword(newPassword);
    setIsSubmitting(false);

    if (!res.ok) {
      setError(res.error || "Failed to update password. Please try requesting a new link.");
      return;
    }

    setSuccess("Password updated successfully! Redirecting to Sign In...");
    setTimeout(() => {
      router.push("/auth?tab=signin");
    }, 2000);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12 text-foreground">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-[36px] text-primary" aria-hidden="true">
            local_fire_department
          </span>
          <span className="font-display text-3xl font-extrabold tracking-tight text-primary">
            GrabIt
          </span>
        </Link>
        <p className="mt-2 font-body text-body-sm text-muted">
          Campus Canteen OS — Secure Password Recovery
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-elevated backdrop-blur-xl">
        <h1 className="font-display text-title font-extrabold text-foreground text-center mb-2">
          Reset Your Password
        </h1>
        <p className="font-body text-caption text-faint text-center mb-6">
          Enter your new password below to regain access to your GrabIt account.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-danger/30 bg-danger-soft p-3 text-center text-caption font-semibold text-danger">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-success/30 bg-success-soft p-3 text-center text-caption font-semibold text-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="mb-1 block font-display text-caption font-bold text-muted"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block font-display text-caption font-bold text-muted"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !!success}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-display text-body-sm font-bold uppercase tracking-wider text-on-primary shadow-glow-primary transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-[18px]">
                  progress_activity
                </span>
                Updating Password...
              </span>
            ) : (
              "Update Password"
            )}
          </button>

          {/* Back to Sign In Link */}
          <div className="mt-4 text-center">
            <Link
              href="/auth?tab=signin"
              className="font-display text-caption font-bold text-primary hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
