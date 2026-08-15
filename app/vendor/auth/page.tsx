"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  signStudentIn,
  signStudentOut,
  sendPasswordResetEmail,
} from "@/lib/supabase/auth";
import { useAuth } from "@/lib/auth/AuthContext";

type ViewMode = "signin" | "forgot";

function VendorAuthFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role } = useAuth();

  const nextParam = searchParams.get("next");
  const errorParam = searchParams.get("error");

  const [mode, setMode] = useState<ViewMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(errorParam);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already authenticated as a vendor, redirect to /vendor
  useEffect(() => {
    if (user && role === "vendor") {
      router.replace(nextParam || "/vendor");
    }
  }, [user, role, router, nextParam]);

  const isEmailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isEmailValid(email)) {
      setErrorMessage("Please enter a valid store email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Password is required.");
      return;
    }

    setIsSubmitting(true);

    // 1. Authenticate credentials via Supabase Auth
    const res = await signStudentIn(email, password);

    if (!res.ok) {
      setIsSubmitting(false);
      if (res.error?.toLowerCase().includes("invalid login credentials")) {
        setErrorMessage("Invalid email or password. Please try again.");
      } else {
        setErrorMessage(res.error || "Authentication failed. Please verify credentials.");
      }
      return;
    }

    // 2. Authoritative role check against public.users
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
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

      if (userRole !== "vendor") {
        // Explicit Fail-Closed: Log out non-vendor account attempting vendor portal access
        await signStudentOut();
        setIsSubmitting(false);
        setErrorMessage("This account does not have access to the Vendor Portal.");
        return;
      }

      setIsSubmitting(false);
      router.push(nextParam || "/vendor");
    } catch {
      await signStudentOut();
      setIsSubmitting(false);
      setErrorMessage("An unexpected error occurred verifying vendor identity.");
    }
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

    setSuccessMessage(
      "Password reset instructions have been sent to your email address.",
    );
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12 text-foreground">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <span
            className="material-symbols-outlined text-[36px] text-primary transition-transform group-hover:scale-110"
            aria-hidden="true"
          >
            storefront
          </span>
          <span className="font-display text-3xl font-extrabold tracking-tight text-primary">
            GrabIt Vendor
          </span>
        </Link>
        <p className="mt-2 font-body text-body-sm text-muted">
          Campus Canteen OS — Store Partner Portal
        </p>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-elevated backdrop-blur-xl transition-all">
        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="font-display text-title font-extrabold text-foreground">
            Vendor Portal
          </h1>
          <p className="mt-1 font-body text-caption text-faint">
            Sign in to manage your GRABIT store, orders, &amp; menu
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
                htmlFor="vendor-email"
                className="mb-1 block font-display text-caption font-bold text-muted"
              >
                Store Email Address
              </label>
              <input
                id="vendor-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@canteen.grabit.in"
                className="w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="vendor-password"
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
                  id="vendor-password"
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
                  Authenticating Store...
                </span>
              ) : (
                "Sign In to Store"
              )}
            </button>
          </form>
        )}

        {/* ----------------- FORGOT PASSWORD FORM ----------------- */}
        {mode === "forgot" && (
          <form onSubmit={handleForgot} className="flex flex-col gap-4">
            <h2 className="font-display text-heading font-extrabold text-foreground text-center">
              Vendor Password Recovery
            </h2>
            <p className="font-body text-caption text-faint text-center mb-2">
              Enter your registered store email address to receive password recovery instructions.
            </p>

            <div>
              <label
                htmlFor="vendor-forgot-email"
                className="mb-1 block font-display text-caption font-bold text-muted"
              >
                Store Email Address
              </label>
              <input
                id="vendor-forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@canteen.grabit.in"
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
                Back to Vendor Sign In
              </button>
            </div>
          </form>
        )}
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
