"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = {
  label: string;
  href: string;
  icon: string; // Material Symbols glyph name
};

/**
 * Bottom tab bar for role surfaces that are primarily mobile (Student).
 * Vendor/Admin use a side rail instead — see RoleShellRail.
 *
 * Active-state styling (filled icon, primary pill background) matches the
 * bottom nav baked into every Stitch export
 * (grabit_campus_home_premium_black/code.html,
 * grabit_menu_premium_black/code.html) rather than the plain hover-only
 * version from Day 1 — now that real routes exist, `usePathname` can
 * drive it for real instead of being a static shell.
 */
export function RoleShellTabBar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-white/10 bg-background/90 shadow-2xl backdrop-blur-md">
      <ul className="mx-auto flex max-w-md items-center justify-around px-4 py-3">
        {items.map((item) => {
          const isActive =
            item.href === "/student"
              ? pathname === "/student"
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
  return (
    <nav className="flex h-dvh w-16 flex-col gap-1 border-r border-border bg-surface-elevated px-2 py-4 md:w-56 md:px-3">
      <p className="mb-4 hidden px-2 font-display text-heading font-800 text-foreground md:block">
        {title}
      </p>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-md px-2.5 py-2 text-body text-muted transition-colors duration-150 hover:bg-surface hover:text-foreground"
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
