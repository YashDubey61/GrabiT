"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    setLoading(true);
    document.cookie = `grabit-admin=true; path=/; max-age=${60 * 60 * 24 * 30}`;
    router.push("/admin");
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Grab<span className="text-accent">It</span>
        </h1>
        <p className="text-sm text-text-secondary mb-10">Super Admin Panel</p>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="
            w-full rounded-xl bg-accent px-6 py-3.5
            text-bg font-semibold transition-all duration-200
            hover:bg-accent-dim active:scale-[0.98]
          "
        >
          {loading ? "Loading..." : "Enter Admin Panel"}
        </button>
        <p className="text-xs text-text-muted mt-3">Mock login — no credentials required</p>
      </div>
    </div>
  );
}
