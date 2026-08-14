"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToastContainer } from "@/components/ui/Toast";

const ADMIN_NAV = [
  { href: "/admin", label: "Revenue", icon: "📈" },
  { href: "/admin/canteens", label: "Canteens", icon: "🏪" },
  { href: "/admin/heatmap", label: "Heatmap", icon: "🗺️" },
  { href: "/admin/payouts", label: "Payouts", icon: "💸" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh bg-bg">
      {/* Sidebar — visible on desktop */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-surface">
        <div className="px-5 py-5">
          <span className="text-accent font-bold text-xl tracking-tight">GrabIt</span>
          <span className="ml-2 text-xs text-text-muted font-medium bg-surface-2 px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {ADMIN_NAV.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-colors duration-200
                  ${
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-text-secondary hover:text-text hover:bg-surface-2"
                  }
                `}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-border">
          <Link
            href="/admin/canteens/new"
            className="block w-full text-center text-sm font-semibold bg-accent text-bg rounded-xl px-4 py-2.5 hover:bg-accent-dim transition-colors"
          >
            + Onboard Canteen
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 md:ml-56">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-accent font-bold text-lg">GrabIt</span>
              <span className="text-xs text-text-muted bg-surface-2 px-2 py-0.5 rounded-full">
                Admin
              </span>
            </div>
          </div>
        </header>

        <main className="pb-20 md:pb-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/80 backdrop-blur-xl safe-bottom">
          <div className="flex items-center justify-around px-1 py-2">
            {ADMIN_NAV.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl
                    transition-colors duration-200
                    ${isActive ? "text-accent" : "text-text-secondary"}
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <ToastContainer />
    </div>
  );
}
