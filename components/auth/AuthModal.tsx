"use client";

import { useState } from "react";
import { signStudentIn, signStudentUp } from "@/lib/supabase/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialTab?: "signin" | "signup";
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialTab = "signin",
}: AuthModalProps) {
  const [tab, setTab] = useState<"signin" | "signup">(initialTab);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("+91");
  const [campusId, setCampusId] = useState("11111111-1111-1111-1111-111111111111");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (tab === "signin") {
      const res = await signStudentIn(email, password);
      setIsSubmitting(false);
      if (!res.ok) {
        setError(res.error ?? "Invalid email or password.");
        return;
      }
      onSuccess();
      onClose();
    } else {
      const res = await signStudentUp(email, password, phone, campusId);
      setIsSubmitting(false);
      if (!res.ok) {
        setError(res.error ?? "Failed to create student account.");
        return;
      }
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-border bg-[#12131a] p-6 shadow-2xl">
        {/* Header & Close */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-primary" aria-hidden="true">
              local_fire_department
            </span>
            <h3 className="font-display text-title font-extrabold tracking-tight text-primary">
              GrabIt Campus
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-xl p-1.5 text-faint hover:bg-surface-elevated hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="mb-6 flex rounded-xl border border-border bg-[#1e1f26] p-1">
          <button
            type="button"
            onClick={() => {
              setTab("signin");
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 font-display text-caption font-bold transition-all ${
              tab === "signin"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-faint hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("signup");
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 font-display text-caption font-bold transition-all ${
              tab === "signup"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-faint hover:text-foreground"
            }`}
          >
            Register
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-center text-caption font-semibold text-danger">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="mb-1 block font-display text-caption font-bold text-muted">
              Student Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@psit.ac.in"
              className="w-full rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 block font-display text-caption font-bold text-muted">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Additional Sign Up Fields */}
          {tab === "signup" && (
            <>
              <div>
                <label className="mb-1 block font-display text-caption font-bold text-muted">
                  Mobile Number (+91)
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 99999 99999"
                  className="w-full rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="mb-1 block font-display text-caption font-bold text-muted">
                  Select Campus
                </label>
                <select
                  value={campusId}
                  onChange={(e) => setCampusId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="11111111-1111-1111-1111-111111111111">PSIT Kanpur</option>
                  <option value="22222222-2222-2222-2222-222222222222">Galgotias University</option>
                  <option value="33333333-3333-3333-3333-333333333333">SRM KTR</option>
                  <option value="44444444-4444-4444-4444-444444444444">LPU Punjab</option>
                </select>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-display text-body-sm font-bold uppercase tracking-wider text-on-primary shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting
              ? "Authenticating..."
              : tab === "signin"
                ? "Sign In to GrabIt"
                : "Create Student Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
