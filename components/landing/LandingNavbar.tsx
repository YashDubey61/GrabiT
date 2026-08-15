"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_HOME } from "@/lib/auth/roles";

export function LandingNavbar() {
  const { user, role, signOut } = useAuth();
  const homePath = role ? ROLE_HOME[role] : "/auth";

  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex h-16 items-center justify-between border-b border-white/10 bg-black/80 px-6 backdrop-blur-xl md:px-12">
      <Link href="/" className="flex items-center gap-2">
        <span className="font-display text-2xl font-black tracking-tighter text-primary">
          GrabIt
        </span>
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        <Link
          href="/student"
          className="font-display text-caption font-bold tracking-wider uppercase text-foreground hover:text-primary transition-colors"
        >
          Student App
        </Link>
        <Link
          href="/vendor"
          className="font-display text-caption font-bold tracking-wider uppercase text-foreground hover:text-primary transition-colors"
        >
          Vendors
        </Link>
        <Link
          href="/superadmin"
          className="font-display text-caption font-bold tracking-wider uppercase text-foreground hover:text-primary transition-colors"
        >
          Super Admin
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <Link
              href={homePath}
              className="font-display text-caption font-bold tracking-wider uppercase text-foreground hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-full border border-border bg-surface-elevated px-4 py-1.5 font-display text-caption font-bold uppercase tracking-wider text-muted hover:text-foreground transition-colors"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/auth?tab=signin"
              className="font-display text-caption font-bold tracking-wider uppercase text-foreground hover:text-primary transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/auth?tab=signup"
              className="rounded-full bg-primary px-5 py-2 font-display text-caption font-extrabold uppercase tracking-widest text-on-primary shadow-glow-primary transition-transform duration-150 active:scale-95 hover:opacity-90"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

