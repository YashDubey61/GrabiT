import Link from "next/link";

export type NavItem = {
  label: string;
  href: string;
  icon: string; // Material Symbols glyph name
};

/**
 * Bottom tab bar for role surfaces that are primarily mobile (Student).
 * Vendor/Admin use a side rail instead — see RoleShellRail.
 * Structural shell only: active-state highlighting will read from the
 * router pathname once real screens land.
 */
export function RoleShellTabBar({ items }: { items: NavItem[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-elevated/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex flex-col items-center gap-1 rounded-md px-3 py-1.5 text-caption text-muted transition-colors duration-150 hover:text-foreground"
            >
              <span className="material-symbols-outlined text-[22px]">
                {item.icon}
              </span>
              {item.label}
            </Link>
          </li>
        ))}
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
