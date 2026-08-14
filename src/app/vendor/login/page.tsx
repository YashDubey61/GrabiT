"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VendorLoginPage() {
  const [email, setEmail] = useState("rajan@cafecentral.in");
  const [password, setPassword] = useState("vendor123");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    // Mock login — just set cookie
    document.cookie = `grabit-vendor-id=v0000000-0000-0000-0000-000000000001; path=/; max-age=${60 * 60 * 24 * 30}`;
    localStorage.setItem("grabit-vendor", JSON.stringify({
      id: "v0000000-0000-0000-0000-000000000001",
      name: "Rajan Kumar",
      canteen_id: "ca000000-0000-0000-0000-000000000001",
      canteen_name: "Café Central",
    }));
    router.push("/vendor");
    setLoading(false);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Grab<span className="text-accent">It</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">Vendor Dashboard</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none focus:border-accent transition-colors"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="
              w-full rounded-xl bg-accent px-6 py-3.5
              text-bg font-semibold transition-all duration-200
              hover:bg-accent-dim active:scale-[0.98]
              disabled:opacity-40
            "
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="text-center text-xs text-text-muted">
            Pre-filled with Café Central vendor credentials
          </p>
        </div>
      </div>
    </div>
  );
}
