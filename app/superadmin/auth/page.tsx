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
import { AnimatedBackground } from "@/components/ui/animated-background";
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
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#050505] px-4 py-12 text-foreground">
      <AnimatedBackground intensity="medium" />

      {/* Brand Header */}
      <div className="relative z-10 mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <span
            className="material-symbols-outlined text-[36px] text-primary transition-transform group-hover:scale-110"
            aria-hidden="true"
          >
            admin_panel_settings
          </span>
          <span className="font-display text-3xl font-extrabold tracking-tight text-white">
            GrabIt <span className="text-primary">Super Admin</span>
          </span>
        </Link>
        <p className="mt-1.5 font-body text-body-sm text-zinc-400">
          Platform Operations Portal
        </p>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#0c0c0e]/80 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_30px_rgba(255,122,0,0.08)] backdrop-blur-2xl transition-all">
        {/* Title & Security Badge */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30 text-primary shadow-[0_0_20px_rgba(255,122,0,0.2)]">
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
              shield
            </span>
          </div>
          <h1 className="font-display text-title font-extrabold text-white">
            Super Admin Portal
          </h1>
          <p className="mt-1 font-body text-caption text-zinc-400">
            Secure access to GRABIT platform administration
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/15 p-3.5 text-caption font-medium text-danger backdrop-blur-md">
            <span className="material-symbols-outlined text-[18px] shrink-0" aria-hidden="true">
              error
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-success/40 bg-success/15 p-3.5 text-caption font-medium text-success backdrop-blur-md">
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
                className="mb-1.5 block font-display text-caption font-bold text-zinc-300"
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
                className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-body-sm text-foreground placeholder:text-zinc-500 focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="admin-password"
                  className="font-display text-caption font-bold text-zinc-300"
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
                  className="font-display text-caption font-semibold text-primary hover:underline cursor-pointer"
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
                  className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-body-sm text-foreground placeholder:text-zinc-500 focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-foreground transition-colors cursor-pointer"
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
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-display text-body-sm font-extrabold uppercase tracking-wider text-black shadow-[0_4px_24px_-2px_rgba(255,122,0,0.5)] transition-all hover:bg-primary-soft hover:shadow-[0_6px_28px_rgba(255,122,0,0.6)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2 text-black font-bold">
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                  Verifying Admin Access...
                </span>
              ) : (
                <span className="text-black font-bold flex items-center gap-1.5">
                  Sign In to Console
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </span>
              )}
            </button>
          </form>
        )}

        {/* ----------------- FORGOT PASSWORD FORM ----------------- */}
        {mode === "forgot" && (
          <form onSubmit={handleForgot} className="flex flex-col gap-4">
            <h2 className="font-display text-heading font-extrabold text-foreground text-center">
              Admin Password Reset
            </h2>
            <p className="font-body text-caption text-zinc-400 text-center mb-2">
              Enter your registered administrator email address to receive password reset
              instructions.
            </p>

            <div>
              <label
                htmlFor="forgot-admin-email"
                className="mb-1.5 block font-display text-caption font-bold text-zinc-300"
              >
                Administrator Email
              </label>
              <input
                id="forgot-admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@grabit.in"
                className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-body-sm text-foreground placeholder:text-zinc-500 focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-display text-body-sm font-extrabold uppercase tracking-wider text-black shadow-[0_4px_24px_-2px_rgba(255,122,0,0.5)] transition-all hover:bg-primary-soft hover:shadow-[0_6px_28px_rgba(255,122,0,0.6)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2 text-black font-bold">
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                  Sending Link...
                </span>
              ) : (
                <span className="text-black font-bold">Send Reset Instructions</span>
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
                className="font-display text-caption font-bold text-primary hover:underline cursor-pointer"
              >
                Back to Sign In
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
