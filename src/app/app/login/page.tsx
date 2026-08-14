"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const handleSendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("otp");
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.student);
        router.push("/app");
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Grab<span className="text-accent">It</span>
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Skip the queue. Grab your food.
          </p>
        </div>

        {step === "phone" ? (
          <div className="space-y-6 animate-slide-up">
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2"
              >
                Phone Number
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 focus-within:border-accent transition-colors">
                <span className="text-text-secondary text-sm">+91</span>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Enter your number"
                  className="flex-1 bg-transparent text-text outline-none placeholder:text-text-muted font-mono text-lg tracking-wider"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-error animate-slide-up">{error}</p>
            )}

            <button
              onClick={handleSendOtp}
              disabled={phone.length < 10 || loading}
              className="
                w-full rounded-xl bg-accent px-6 py-3.5
                text-bg font-semibold text-base
                transition-all duration-200
                hover:bg-accent-dim active:scale-[0.98]
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              {loading ? "Sending..." : "Get OTP"}
            </button>

            <p className="text-center text-xs text-text-muted">
              Use <span className="font-mono text-accent">123456</span> as OTP in dev mode
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up">
            <div>
              <label
                htmlFor="otp"
                className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2"
              >
                Enter OTP
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="• • • • • •"
                className="
                  w-full rounded-xl border border-border bg-surface
                  px-4 py-3 text-center font-mono text-2xl tracking-[0.5em]
                  text-text outline-none
                  placeholder:text-text-muted placeholder:tracking-[0.3em]
                  focus:border-accent transition-colors
                "
                autoFocus
              />
              <p className="mt-2 text-xs text-text-muted text-center">
                Sent to +91 {phone}
              </p>
            </div>

            {error && (
              <p className="text-sm text-error animate-slide-up">{error}</p>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={otp.length < 6 || loading}
              className="
                w-full rounded-xl bg-accent px-6 py-3.5
                text-bg font-semibold text-base
                transition-all duration-200
                hover:bg-accent-dim active:scale-[0.98]
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>

            <button
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError("");
              }}
              className="w-full text-center text-sm text-text-secondary hover:text-accent transition-colors"
            >
              ← Change number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
