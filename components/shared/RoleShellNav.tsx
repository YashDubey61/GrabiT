"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { hardNavigate } from "@/lib/auth/redirect";
import { ROLE_AUTH_PATH } from "@/lib/auth/roles";

export type NavItem = {
  label: string;
  href: string;
  icon: string; // Material Symbols glyph name
};

// Role-root paths ("/vendor", "/customer", "/superadmin") must only be
// "active" on an exact match — every other route under that role also
// starts with the same prefix, so a naive startsWith() would keep the
// root item highlighted no matter which page is actually open.
const ROLE_ROOT_PATHS = new Set(["/vendor", "/customer", "/superadmin"]);

// Static lookup, not a template-string class name — Tailwind can only
// see (and keep in the production build) classes that appear literally
// in source. A computed `grid-cols-${n}` string would be invisible to
// the JIT scanner and could resolve to a different (or zero) style on
// the client than whatever the server happened to inline, which is
// exactly the kind of "non-deterministic className" that produces a
// hydration attribute mismatch on this <ul>.
const GRID_COLS_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

function isNavItemActive(href: string, pathname: string): boolean {
  return ROLE_ROOT_PATHS.has(href) ? pathname === href : pathname.startsWith(href);
}

/**
 * Bottom tab bar for role surfaces that are primarily mobile (Student).
 * Vendor/Admin use a side rail instead — see RoleShellRail.
 */
export function RoleShellTabBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  if (pathname === "/customer/checkout") {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[max(0.75rem,var(--safe-area-inset-bottom,0px))] px-4">
      <nav className="pointer-events-auto w-full max-w-[340px] rounded-full border border-white/10 bg-[#121212]/95 px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <ul className={`grid items-center gap-1 ${GRID_COLS_CLASS[items.length] ?? "grid-cols-4"}`}>
          {items.map((item) => {
            const isActive = isNavItemActive(item.href, pathname);

            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-full py-1 px-1 text-center transition-all duration-150 ${
                    isActive
                      ? "bg-primary/15 text-primary font-bold"
                      : "text-muted hover:text-foreground font-medium"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span className="text-[10px] leading-tight line-clamp-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

/**
 * Side rail for desktop/tablet-first surfaces (Vendor, Admin). Vendor screens
 * must work on both phone and tablet/desktop per the brief, so this rail
 * collapses to icons-only below the `md` breakpoint rather than disappearing.
 */
export function RoleShellRail({
  items,
  title,
}: {
  items: NavItem[];
  title: string;
}) {
  const pathname = usePathname();
  const { signOut, role } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    // Capture before signOut() clears the auth context's role — this rail
    // is shared by both Vendor and Super Admin, so the redirect must go
    // back to whichever role's own login page, never a hardcoded one.
    const authPath = role ? ROLE_AUTH_PATH[role] : "/auth";
    setIsSigningOut(true);
    try {
      await signOut();
      if (typeof window !== "undefined") {
        localStorage.removeItem("grabit_vendor_cache");
      }
    } finally {
      setIsSigningOut(false);
      hardNavigate(authPath);
    }
  };

  return (
    <nav className="flex h-dvh w-16 flex-col justify-between border-r border-border bg-surface-elevated px-2 py-4 md:w-56 md:px-3">
      <div className="flex flex-col gap-1 overflow-y-auto">
        <p className="mb-4 hidden px-2 font-display text-heading font-800 text-foreground md:block">
          {title}
        </p>
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const isActive = isNavItemActive(item.href, pathname);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-md px-2.5 py-2 text-body font-semibold transition-colors duration-150 ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sign Out Action at bottom of rail */}
      <div className="pt-2 border-t border-border">
        <button
          type="button"
          disabled={isSigningOut}
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-body font-semibold text-danger/80 hover:bg-danger-soft hover:text-danger transition-colors duration-150 disabled:opacity-50"
          title="Sign Out"
        >
          <span
            className={`material-symbols-outlined text-[20px] ${
              isSigningOut ? "animate-spin text-danger" : ""
            }`}
          >
            {isSigningOut ? "progress_activity" : "logout"}
          </span>
          <span className="hidden md:inline">
            {isSigningOut ? "Signing Out..." : "Sign Out"}
          </span>
        </button>
      </div>
    </nav>
  );
}
