"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToastContainer } from "@/components/ui/Toast";

const VENDOR_NAV = [
  { href: "/vendor", label: "Orders", icon: "📋" },
  { href: "/vendor/menu", label: "Menu", icon: "🍽️" },
  { href: "/vendor/sales", label: "Sales", icon: "📊" },
  { href: "/vendor/manual-order", label: "Manual", icon: "✏️" },
  { href: "/vendor/payouts", label: "Payouts", icon: "💰" },
];

export function VendorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-xl px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-accent font-bold text-lg tracking-tight">GrabIt</span>
            <span className="text-xs text-text-muted font-medium bg-surface-2 px-2 py-0.5 rounded-full">
              Vendor
            </span>
          </div>
          <Link
            href="/vendor/login"
            className="text-xs text-text-secondary hover:text-accent transition-colors"
          >
            Logout
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/80 backdrop-blur-xl safe-bottom">
        <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-2">
          {VENDOR_NAV.map((item) => {
            const isActive =
              item.href === "/vendor"
                ? pathname === "/vendor"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl
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

      <ToastContainer />
    </div>
  );
}
