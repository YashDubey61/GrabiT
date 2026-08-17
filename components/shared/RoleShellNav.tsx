"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

export type NavItem = {
  label: string;
  href: string;
  icon: string; // Material Symbols glyph name
};

/**
 * Bottom tab bar for role surfaces that are primarily mobile (Student).
 * Vendor/Admin use a side rail instead — see RoleShellRail.
 */
export function RoleShellTabBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-white/10 bg-background/90 shadow-2xl backdrop-blur-md">
      <ul className="mx-auto flex max-w-md items-center justify-around px-4 py-3">
        {items.map((item) => {
          const isActive =
            item.href === "/customer"
              ? pathname === "/customer"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-label font-700 transition-all duration-150 ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[22px]"
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
      </ul>
    </nav>
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
  const { signOut } = useAuth();

  return (
    <nav className="flex h-dvh w-16 flex-col justify-between border-r border-border bg-surface-elevated px-2 py-4 md:w-56 md:px-3">
      <div className="flex flex-col gap-1 overflow-y-auto">
        <p className="mb-4 hidden px-2 font-display text-heading font-800 text-foreground md:block">
          {title}
        </p>
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const isActive =
              item.href === "/vendor" || item.href === "/superadmin"
                ? pathname === item.href
                : pathname.startsWith(item.href);

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
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-body font-semibold text-danger/80 hover:bg-danger-soft hover:text-danger transition-colors duration-150"
          title="Sign Out"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
