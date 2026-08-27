"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GrabItLogo } from "@/components/shared/GrabItLogo";
import {
  signStudentIn,
  signStudentUp,
  signInWithGoogle,
  sendPasswordResetEmail,
} from "@/lib/supabase/auth";
import { useAuth } from "@/lib/auth/AuthContext";
import { isNativePlatform } from "@/lib/capacitor/platform";
import { getSafeRedirectUrl, hardNavigate, authLog, authError } from "@/lib/auth/redirect";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

type AuthMode = "signin" | "signup" | "forgot";

function AuthFormContent() {
  const searchParams = useSearchParams();
  const { user, role, isLoading, refreshAuth } = useAuth();

  const tabParam = searchParams.get("tab");
  const errorParam = searchParams.get("error");
  const nextParam = searchParams.get("next");

  // Only ever redirect once, at this tab's initial auth resolution — the
  // Supabase client syncs session changes made in OTHER tabs into this
  // context too, and without this guard that would silently bounce a tab
  // sitting on /auth to another tab's freshly-signed-in dashboard.
  const hasCheckedInitialAuthRef = useRef(false);

  const initialMode: AuthMode =
    tabParam === "signup" ? "signup" : tabParam === "forgot" ? "forgot" : "signin";

  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(errorParam);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect if already logged in — evaluated once, at this tab's own
  // initial auth resolution, not on every later change (see ref above).
  useEffect(() => {
    if (isLoading || hasCheckedInitialAuthRef.current) return;
    hasCheckedInitialAuthRef.current = true;
    if (user && role) {
      const destination = getSafeRedirectUrl(nextParam, role);
      authLog("Already authenticated on mount, role:", role, "target:", destination);
      hardNavigate(destination);
    }
  }, [user, role, isLoading, nextParam]);

  // Validation helpers
  const isEmailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const passwordStrength = (p: string) => {
    if (!p) return { score: 0, label: "", color: "text-faint" };
    if (p.length < 6) return { score: 1, label: "Too short (min 6 chars)", color: "text-danger" };
    const hasNum = /\d/.test(p);
    const hasUpper = /[A-Z]/.test(p);
    const hasSpecial = /[^A-Za-z0-9]/.test(p);

    if (p.length >= 8 && hasNum && (hasUpper || hasSpecial)) {
      return { score: 3, label: "Strong password", color: "text-success" };
    }
    return { score: 2, label: "Medium strength", color: "text-warning" };
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!email || !trimmedEmail) {
      setErrorMessage("Please enter your email.");
      return;
    }
    if (!isEmailValid(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    authLog("Login submitted (student portal)");
    try {
      const res = await signStudentIn(trimmedEmail, password);
      if (!res.ok) {
        authError("Authentication failed:", res.error);
        setErrorMessage(res.error || "Sign in failed. Please check your email and password.");
        setIsSubmitting(false);
        return;
      }

      if (!res.session) {
        authError("Authentication reported ok but no session was returned");
        setErrorMessage("We couldn’t complete your sign in. Please try again.");
        setIsSubmitting(false);
        return;
      }

      authLog("Authentication successful, session confirmed");

      const userRole = res.role || "student";
      authLog("Role detected:", userRole);

      // Refresh AuthContext so the rest of the app (nav, guards) sees the
      // new session before we hand off to the destination route.
      try {
        await refreshAuth();
        authLog("User/profile loaded via refreshAuth");
      } catch (refreshErr) {
        authError("refreshAuth failed (non-fatal, session already confirmed):", refreshErr);
      }

      if (userRole === "vendor") {
        const destination = getSafeRedirectUrl(nextParam, "vendor");
        authLog("Target route:", destination);
        setSuccessMessage("Signed in successfully as Vendor. Redirecting to Vendor Dashboard...");
        authLog("Redirecting...");
        hardNavigate(destination);
        return;
      }

      if (userRole === "admin") {
        const destination = getSafeRedirectUrl(nextParam, "admin");
        authLog("Target route:", destination);
        setSuccessMessage("Signed in successfully as Super Admin. Redirecting to Super Admin Portal...");
        authLog("Redirecting...");
        hardNavigate(destination);
        return;
      }

      const destination = getSafeRedirectUrl(nextParam, "student");
      authLog("Target route:", destination);
      setSuccessMessage("Signed in successfully.");
      authLog("Redirecting...");
      hardNavigate(destination);
    } catch (err) {
      authError("Unexpected error during sign-in:", err);
      setErrorMessage("Unable to sign in right now. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage("Full Name is required.");
      return;
    }
    if (!isEmailValid(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);
    const res = await signStudentUp(email, password, fullName);
    setIsSubmitting(false);

    if (!res.ok) {
      if (res.error?.toLowerCase().includes("already registered")) {
        setErrorMessage("An account with this email already exists. Please Sign In.");
      } else {
        setErrorMessage(res.error || "Failed to create account. Please try again.");
      }
      return;
    }

    setSuccessMessage(
      "Account created successfully! Check your email for verification if required, or sign in now.",
    );
    setTimeout(() => {
      setMode("signin");
    }, 2000);
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    const res = await signInWithGoogle();
    if (!res.ok) {
      setIsGoogleLoading(false);
      if (res.error !== "USER_CANCELLED") {
        setErrorMessage(res.error || "Failed to initiate Google authentication.");
      }
      return;
    }

    if (isNativePlatform()) {
      setIsGoogleLoading(false);
      try {
        await refreshAuth();
      } catch (err) {
        // ignore
      }
      hardNavigate(getSafeRedirectUrl(nextParam, "student"));
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isEmailValid(email)) {
      setErrorMessage("Please enter a valid email address.");
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
      "Password reset instructions have been sent to your email. Please check your inbox.",
    );
  };

  const strength = passwordStrength(password);

  if (user && role) {
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-[#050505] px-4 py-12 text-foreground">
        <div className="mb-6 flex flex-col items-center text-center">
          <GrabItLogo href="/customer" heightClassName="h-16 sm:h-20" priority />
        </div>
        <div className="flex items-center gap-2 text-muted font-display font-medium rounded-full bg-white/[0.05] border border-white/[0.10] px-4 py-2 backdrop-blur-md">
          <span className="material-symbols-outlined animate-spin text-[20px] text-primary">
            progress_activity
          </span>
          <span>Redirecting to your campus...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-[#050505] px-4 py-12 text-foreground">
      {/* Header Logo */}

      {/* Header Logo */}
      <div className="mb-6 flex flex-col items-center text-center z-10">
        <GrabItLogo href="/customer" heightClassName="h-16 sm:h-20" priority />
      </div>

      {/* Main Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#0c0c0e]/80 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_30px_rgba(255,122,0,0.08)] backdrop-blur-2xl transition-all">
        {/* Mode Selector Tabs (Sign In / Register) */}
        {mode !== "forgot" && (
          <div className="mb-6 flex rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1 backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 rounded-xl py-2.5 font-display text-caption font-extrabold transition-all cursor-pointer ${
                mode === "signin"
                  ? "bg-primary text-black shadow-[0_4px_16px_rgba(255,122,0,0.4)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 rounded-xl py-2.5 font-display text-caption font-extrabold transition-all cursor-pointer ${
                mode === "signup"
                  ? "bg-primary text-black shadow-[0_4px_16px_rgba(255,122,0,0.4)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

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
          <form onSubmit={handleSignIn} noValidate className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label
                htmlFor="signin-email"
                className="mb-1.5 block font-display text-caption font-bold text-zinc-300"
              >
                Student / User Email
              </label>
              <input
                id="signin-email"
                type="email"
                disabled={isSubmitting || isGoogleLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@campus.ac.in"
                className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-body-sm text-foreground placeholder:text-zinc-500 focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="signin-password"
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
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  disabled={isSubmitting || isGoogleLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-body-sm text-foreground placeholder:text-zinc-500 focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all pr-10 disabled:opacity-50"
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

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-display text-body-sm font-extrabold uppercase tracking-wider text-black shadow-[0_4px_24px_-2px_rgba(255,122,0,0.5)] transition-all hover:bg-primary-soft hover:shadow-[0_6px_28px_rgba(255,122,0,0.6)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2 text-black font-bold">
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                  Signing In...
                </span>
              ) : (
                <span className="text-black font-bold flex items-center gap-1.5">
                  Sign In
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-2 flex items-center justify-center">
              <div className="w-full border-t border-white/[0.08]" />
              <span className="absolute bg-[#0c0c0e] px-3 font-display text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                OR CONTINUE WITH
              </span>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || isGoogleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.06] py-3.5 font-display text-body-sm font-bold text-foreground transition-all hover:bg-white/[0.12] hover:border-white/[0.2] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isGoogleLoading ? (
                <span className="material-symbols-outlined animate-spin text-[20px] text-primary">
                  progress_activity
                </span>
              ) : (
                <GoogleIcon />
              )}
              <span>Continue with Google</span>
            </button>

            {/* Switch to Signup Link */}
            <p className="mt-3 text-center font-body text-caption text-zinc-400">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-display font-bold text-primary hover:underline cursor-pointer"
              >
                Sign Up Now
              </button>
            </p>
          </form>
        )}

        {/* ----------------- SIGN UP FORM ----------------- */}
        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="signup-name"
                className="mb-1.5 block font-display text-caption font-bold text-zinc-300"
              >
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-body-sm text-foreground placeholder:text-zinc-500 focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="signup-email"
                className="mb-1.5 block font-display text-caption font-bold text-zinc-300"
              >
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@campus.ac.in"
                className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-body-sm text-foreground placeholder:text-zinc-500 focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="signup-password"
                className="mb-1.5 block font-display text-caption font-bold text-zinc-300"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
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

              {/* Password Strength Meter */}
              {password && (
                <div className="mt-1.5 flex items-center justify-between text-label font-bold">
                  <span className={strength.color}>{strength.label}</span>
                  <div className="flex gap-1">
                    <div
                      className={`h-1.5 w-6 rounded-full ${
                        strength.score >= 1 ? "bg-danger" : "bg-white/[0.1]"
                      }`}
                    />
                    <div
                      className={`h-1.5 w-6 rounded-full ${
                        strength.score >= 2 ? "bg-warning" : "bg-white/[0.1]"
                      }`}
                    />
                    <div
                      className={`h-1.5 w-6 rounded-full ${
                        strength.score >= 3 ? "bg-success" : "bg-white/[0.1]"
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="signup-confirm-password"
                className="mb-1.5 block font-display text-caption font-bold text-zinc-300"
              >
                Confirm Password
              </label>
              <input
                id="signup-confirm-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-body-sm text-foreground placeholder:text-zinc-500 focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isGoogleLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-display text-body-sm font-extrabold uppercase tracking-wider text-black shadow-[0_4px_24px_-2px_rgba(255,122,0,0.5)] transition-all hover:bg-primary-soft hover:shadow-[0_6px_28px_rgba(255,122,0,0.6)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2 text-black font-bold">
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                  Creating Account...
                </span>
              ) : (
                <span className="text-black font-bold flex items-center gap-1.5">
                  Create Account
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-2 flex items-center justify-center">
              <div className="w-full border-t border-white/[0.08]" />
              <span className="absolute bg-[#0c0c0e] px-3 font-display text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                OR CONTINUE WITH
              </span>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || isGoogleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.06] py-3.5 font-display text-body-sm font-bold text-foreground transition-all hover:bg-white/[0.12] hover:border-white/[0.2] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isGoogleLoading ? (
                <span className="material-symbols-outlined animate-spin text-[20px] text-primary">
                  progress_activity
                </span>
              ) : (
                <GoogleIcon />
              )}
              <span>Continue with Google</span>
            </button>

            {/* Switch to Sign In Link */}
            <p className="mt-3 text-center font-body text-caption text-zinc-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-display font-bold text-primary hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </form>
        )}

        {/* ----------------- FORGOT PASSWORD FORM ----------------- */}
        {mode === "forgot" && (
          <form onSubmit={handleForgot} className="flex flex-col gap-4">
            <h2 className="font-display text-heading font-extrabold text-foreground text-center">
              Recover Password
            </h2>
            <p className="font-body text-caption text-zinc-400 text-center mb-2">
              Enter your registered email address and we will send you a link to reset your
              password.
            </p>

            <div>
              <label
                htmlFor="forgot-email"
                className="mb-1.5 block font-display text-caption font-bold text-zinc-300"
              >
                Email Address
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@campus.ac.in"
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
                <span className="text-black font-bold">Send Reset Link</span>
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

export default function AuthPage() {
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
      <AuthFormContent />
    </Suspense>
  );
}
