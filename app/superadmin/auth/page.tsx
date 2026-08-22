"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  signStudentIn,
  signStudentOut,
  sendPasswordResetEmail,
} from "@/lib/supabase/auth";
import { useAuth } from "@/lib/auth/AuthContext";
import { getSafeRedirectUrl, hardNavigate, authLog, authError, authReject } from "@/lib/auth/redirect";

type ViewMode = "signin" | "forgot";

function SuperAdminAuthFormContent() {
  const searchParams = useSearchParams();
  const { user, role, isLoading, refreshAuth } = useAuth();

  const nextParam = searchParams.get("next");
  const errorParam = searchParams.get("error");

  // Only ever redirect once, at this tab's initial auth resolution — see
  // app/auth/page.tsx for why (cross-tab Supabase session sync).
  const hasCheckedInitialAuthRef = useRef(false);

  const [mode, setMode] = useState<ViewMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(errorParam);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already authenticated as an admin, redirect to /superadmin —
  // evaluated once, at this tab's own initial auth resolution.
  useEffect(() => {
    if (isLoading || hasCheckedInitialAuthRef.current) return;
    hasCheckedInitialAuthRef.current = true;
    if (user && role === "admin") {
      const destination = getSafeRedirectUrl(nextParam, "admin");
      authLog("Already authenticated as admin on mount, target:", destination);
      hardNavigate(destination);
    }
  }, [user, role, isLoading, nextParam]);

  const isEmailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isEmailValid(email)) {
      setErrorMessage("Please enter a valid administrator email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Password is required.");
      return;
    }

    setIsSubmitting(true);
    authLog("Login submitted (superadmin portal)");

    // 1. Authenticate credentials via Supabase Auth
    const res = await signStudentIn(email, password);

    if (!res.ok) {
      authError("Authentication failed:", res.error);
      setIsSubmitting(false);
      if (res.error?.toLowerCase().includes("invalid login credentials")) {
        setErrorMessage("Invalid email or password. Please try again.");
      } else {
        setErrorMessage(res.error || "Authentication failed. Please verify credentials.");
      }
      return;
    }

    if (!res.session) {
      authError("Authentication reported ok but no session was returned");
      setIsSubmitting(false);
      setErrorMessage("We couldn't complete your sign in. Please try again.");
      return;
    }

    authLog("Authentication successful, session confirmed");

    // 2. Authoritative role check against public.users (role must be 'admin')
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        authError("Failed to resolve authenticated user after sign-in");
        setIsSubmitting(false);
        setErrorMessage("Failed to resolve authentication session.");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", authUser.id)
        .maybeSingle();

      const userRole = profile?.role;
      authLog("Role detected:", userRole ?? "(none)");

      if (userRole !== "admin") {
        // Explicit Fail-Closed: Log out non-admin account attempting superadmin access
        authReject("Account is not an admin (role:", userRole, ") — rejecting superadmin portal access");
        await signStudentOut();
        setIsSubmitting(false);
        setErrorMessage("This account does not have Super Admin access.");
        return;
      }
    } catch (roleCheckErr) {
      authError("Unexpected error verifying administrator role:", roleCheckErr);
      await signStudentOut();
      setIsSubmitting(false);
      setErrorMessage("An unexpected error occurred verifying administrator identity.");
      return;
    }

    // 3. Refresh AuthContext, then hand off with a full navigation so
    // middleware re-evaluates against the just-established session.
    try {
      await refreshAuth();
      authLog("User/profile loaded via refreshAuth");
    } catch (refreshErr) {
      authError("refreshAuth failed (non-fatal, session already confirmed):", refreshErr);
    }

    const destination = getSafeRedirectUrl(nextParam, "admin");
    authLog("Target route:", destination);
    setSuccessMessage("Signed in successfully as Super Admin. Redirecting to Super Admin Portal...");
    authLog("Redirecting...");
    hardNavigate(destination);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isEmailValid(email)) {
      setErrorMessage("Please enter a valid administrator email address.");
      return;
    }

    setIsSubmitting(true);
    const res = await sendPasswordResetEmail(email);
    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMessage(res.error || "Failed to send reset link. Please try again.");
      return;
    }

    setSuccessMessage(
      "Password reset instructions have been sent to your administrator email address.",
    );
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12 text-foreground">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <span
            className="material-symbols-outlined text-[36px] text-primary transition-transform group-hover:scale-110"
            aria-hidden="true"
          >
            admin_panel_settings
          </span>
          <span className="font-display text-3xl font-extrabold tracking-tight text-primary">
            GrabIt Super Admin
          </span>
        </Link>
        <p className="mt-2 font-body text-body-sm text-muted">
          Platform Operations Portal
        </p>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-elevated backdrop-blur-xl transition-all">
        {/* Title & Security Badge */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              shield
            </span>
          </div>
          <h1 className="font-display text-title font-extrabold text-foreground">
            Super Admin Portal
          </h1>
          <p className="mt-1 font-body text-caption text-faint">
            Secure access to GRABIT platform administration
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-soft p-3.5 text-caption font-medium text-danger">
            <span className="material-symbols-outlined text-[18px] shrink-0" aria-hidden="true">
              error
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-success/30 bg-success-soft p-3.5 text-caption font-medium text-success">
            <span className="material-symbols-outlined text-[18px] shrink-0" aria-hidden="true">
              check_circle
            </span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* ----------------- SIGN IN FORM ----------------- */}
        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label
                htmlFor="admin-email"
                className="mb-1 block font-display text-caption font-bold text-muted"
              >
                Administrator Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@grabit.in"
                className="w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="admin-password"
                  className="font-display text-caption font-bold text-muted"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-display text-caption font-semibold text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-display text-body-sm font-bold uppercase tracking-wider text-on-primary shadow-glow-primary transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                  Authenticating Administrator...
                </span>
              ) : (
                "Sign In to Admin Portal"
              )}
            </button>
          </form>
        )}

        {/* ----------------- FORGOT PASSWORD FORM ----------------- */}
        {mode === "forgot" && (
          <form onSubmit={handleForgot} className="flex flex-col gap-4">
            <h2 className="font-display text-heading font-extrabold text-foreground text-center">
              Administrator Recovery
            </h2>
            <p className="font-body text-caption text-faint text-center mb-2">
              Enter your registered administrator email address to receive password recovery instructions.
            </p>

            <div>
              <label
                htmlFor="admin-forgot-email"
                className="mb-1 block font-display text-caption font-bold text-muted"
              >
                Administrator Email
              </label>
              <input
                id="admin-forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@grabit.in"
                className="w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-display text-body-sm font-bold uppercase tracking-wider text-on-primary shadow-glow-primary transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                  Sending Link...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-display text-caption font-bold text-primary hover:underline"
              >
                Back to Admin Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SuperAdminAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background text-primary">
          <span className="material-symbols-outlined animate-spin text-[36px]">
            progress_activity
          </span>
        </div>
      }
    >
      <SuperAdminAuthFormContent />
    </Suspense>
  );
}
