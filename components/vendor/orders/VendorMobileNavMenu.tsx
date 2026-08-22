"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { hardNavigate } from "@/lib/auth/redirect";
import type { NavItem } from "@/components/shared/RoleShellNav";

interface VendorMobileNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  onOpenProfile: () => void;
}

/** Compact "⋯" nav drawer for the mobile/tablet header — surfaces every
 * existing Vendor route (same list the desktop rail uses) plus Profile
 * and Sign Out. Not a second navigation system: it links to the exact
 * same routes/handlers the rail and bottom tab bar already use. */
export function VendorMobileNavMenu({ isOpen, onClose, items, onOpenProfile }: VendorMobileNavMenuProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      if (typeof window !== "undefined") {
        localStorage.removeItem("grabit_vendor_cache");
      }
    } finally {
      setIsSigningOut(false);
      hardNavigate("/vendor/auth");
    }
  };

  return (
    <div className="fixed inset-0 z-[75] sm:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      />
      <div className="absolute left-3 top-14 w-56 animate-in fade-in slide-in-from-top-2 duration-150 rounded-2xl border border-border bg-surface-elevated p-1.5 shadow-2xl">
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            const isActive = item.href === "/vendor" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-display text-body-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-foreground hover:bg-surface-elevated"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}

          <li aria-hidden="true">
            <div className="my-1 h-px bg-border" />
          </li>

          <li>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenProfile();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-display text-body-sm font-semibold text-foreground transition-colors hover:bg-surface-elevated"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                account_circle
              </span>
              Profile
            </button>
          </li>

          <li>
            <button
              type="button"
              disabled={isSigningOut}
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-display text-body-sm font-semibold text-danger transition-colors hover:bg-danger-soft disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                logout
              </span>
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
