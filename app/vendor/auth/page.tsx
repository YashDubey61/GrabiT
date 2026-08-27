"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  signVendorIn,
  signStudentOut,
  sendPasswordResetEmail,
} from "@/lib/supabase/auth";
import { useAuth } from "@/lib/auth/AuthContext";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { getSafeRedirectUrl, hardNavigate, hardReplace, authLog, authError, authReject } from "@/lib/auth/redirect";

type ViewMode = "signin" | "forgot";

function VendorAuthFormContent() {
  const searchParams = useSearchParams();
  const { user, role, isLoading, refreshAuth } = useAuth();

  const nextParam = searchParams.get("next");
  const errorParam = searchParams.get("error");
  const reasonParam = searchParams.get("reason");

  const hasCheckedInitialAuthRef = useRef(false);

  const [mode, setMode] = useState<ViewMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam || (reasonParam === "expired" ? "Your session has expired. Please sign in again." : null),
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already authenticated as a vendor, redirect directly to /vendor
  useEffect(() => {
    if (isLoading || hasCheckedInitialAuthRef.current) return;
    hasCheckedInitialAuthRef.current = true;
    if (user && role === "vendor") {
      const destination = getSafeRedirectUrl(nextParam, "vendor");
      authLog("Already authenticated as vendor on mount, target:", destination);
      hardReplace(destination);
    }
  }, [user, role, isLoading, nextParam]);

  const isEmailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !isEmailValid(trimmedEmail)) {
      setErrorMessage("Please enter a valid store email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your store password.");
      return;
    }

    setIsSubmitting(true);
    authLog("Login submitted (vendor portal)");

    // 1. Authenticate vendor credentials via Supabase Auth
    const res = await signVendorIn(trimmedEmail, password);

    if (!res.ok) {
      authError("Authentication failed:", res.error);
      setIsSubmitting(false);
      setErrorMessage(res.error || "Invalid credentials. Please check your email and password.");
      return;
    }

    if (!res.session) {
      authError("Authentication reported ok but no session was returned");
      setIsSubmitting(false);
      setErrorMessage("We couldn't complete vendor authentication. Please try again.");
      return;
    }

    // 2. Authoritative role check against public.users
    if (res.role !== "vendor") {
      authReject("Account is not a vendor (role:", res.role, ") — rejecting vendor portal access");
      await signStudentOut();
      setIsSubmitting(false);
      setErrorMessage("This account does not have vendor access. Please contact your campus administrator.");
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        authError("Failed to resolve authenticated user after sign-in");
        await signStudentOut();
        setIsSubmitting(false);
        setErrorMessage("Failed to resolve authentication session.");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("canteen_id")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!profile?.canteen_id) {
        authError("Vendor account has no assigned canteen_id — rejecting access");
        await signStudentOut();
        setIsSubmitting(false);
        setErrorMessage("This vendor account is not linked to a store yet. Please contact your administrator.");
        return;
      }
    } catch (roleCheckErr) {
      authError("Unexpected error verifying vendor canteen assignment:", roleCheckErr);
      await signStudentOut();
      setIsSubmitting(false);
      setErrorMessage("An unexpected error occurred verifying store assignment.");
      return;
    }

    // 3. Refresh AuthContext and navigate to dashboard
    try {
      await refreshAuth();
    } catch (refreshErr) {
      authError("refreshAuth failed:", refreshErr);
    }

    const destination = getSafeRedirectUrl(nextParam, "vendor");
    setSuccessMessage("Sign in successful! Opening Vendor Dashboard...");
    hardNavigate(destination);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isEmailValid(email)) {
      setErrorMessage("Please enter a valid store email address.");
      return;
    }

    setIsSubmitting(true);
    const res = await sendPasswordResetEmail(email);
    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMessage(res.error || "Failed to send reset link. Please try again.");
      return;
    }

    setSuccessMessage("Password reset instructions have been sent to your store email address.");
  };

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-[#050505] px-4 py-8 text-foreground selection:bg-primary selection:text-black">
      <AnimatedBackground intensity="medium" />

      {/* Standalone Center Container */}
      <div className="relative z-10 w-full max-w-[440px] rounded-3xl border border-white/[0.12] bg-[#0c0c0e]/80 p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_30px_rgba(255,122,0,0.08)] backdrop-blur-2xl">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-black shadow-[0_4px_16px_rgba(255,122,0,0.4)] transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[26px]">storefront</span>
            </span>
            <span className="font-display text-2xl font-black tracking-tight text-white">
              GrabIt <span className="text-primary">Vendor</span>
            </span>
          </Link>

          <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-white">
            {mode === "signin" ? "Vendor Sign In" : "Reset Password"}
          </h1>
          <p className="mt-1.5 font-body text-caption text-zinc-400 leading-relaxed">
            {mode === "signin"
              ? "Sign in to manage your store, orders, and menu."
              : "Enter your store email address to receive recovery instructions."}
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-danger/40 bg-danger/15 p-3.5 text-caption font-semibold text-danger backdrop-blur-md animate-in fade-in duration-200">
            <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-success/40 bg-success/15 p-3.5 text-caption font-semibold text-success backdrop-blur-md animate-in fade-in duration-200">
            <span className="material-symbols-outlined text-[18px] shrink-0">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="vendor-email" className="mb-1.5 block font-display text-caption font-bold text-zinc-300">
                Store Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-[20px]">
                  mail
                </span>
                <input
                  id="vendor-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendor@canteen.grabit.in"
                  className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.04] py-3 pl-11 pr-4 text-body-sm text-white placeholder:text-zinc-500 focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="vendor-password" className="font-display text-caption font-bold text-zinc-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-display text-caption font-bold text-primary hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-[20px]">
                  lock
                </span>
                <input
                  id="vendor-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.04] py-3 pl-11 pr-11 text-body-sm text-white placeholder:text-zinc-500 focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-display text-body-sm font-extrabold uppercase tracking-wider text-black shadow-[0_4px_24px_-2px_rgba(255,122,0,0.5)] transition-all hover:bg-primary-soft hover:shadow-[0_6px_28px_rgba(255,122,0,0.6)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2 text-black font-bold">
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                  Authenticating Store...
                </span>
              ) : (
                <span className="text-black font-bold flex items-center gap-1.5">
                  Sign In
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </span>
              )}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label htmlFor="vendor-forgot-email" className="mb-1.5 block font-display text-caption font-bold text-muted">
                Store Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint text-[20px]">
                  mail
                </span>
                <input
                  id="vendor-forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendor@canteen.grabit.in"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-body-sm text-white placeholder:text-faint focus:border-primary focus:bg-white/10 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-display text-body-sm font-extrabold uppercase tracking-wider text-on-primary shadow-glow-primary transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
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

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="inline-flex items-center gap-1 font-display text-caption font-bold text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Footer Link */}
        <div className="mt-8 border-t border-white/10 pt-4 text-center">
          <p className="font-body text-caption text-faint">
            Need help? Contact your{" "}
            <Link href="/auth" className="font-semibold text-muted hover:text-white transition-colors">
              Campus Admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VendorAuthPage() {
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
      <VendorAuthFormContent />
    </Suspense>
  );
}
