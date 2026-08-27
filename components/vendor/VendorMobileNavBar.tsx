"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fetchVendorNotificationsApi } from "@/lib/supabase/vendor_notifications_center";

export interface VendorMobileNavItem {
  label: string;
  href: string;
  icon: string;
}

const MORE_GRID_ITEMS: VendorMobileNavItem[] = [
  { label: "Inventory", href: "/vendor/inventory", icon: "inventory_2" },
  { label: "Offers & Promos", href: "/vendor/offers", icon: "local_offer" },
  { label: "Analytics", href: "/vendor/analytics", icon: "monitoring" },
  { label: "Payouts & Finance", href: "/vendor/payouts", icon: "account_balance_wallet" },
  { label: "Reviews & Ratings", href: "/vendor/reviews", icon: "star" },
  { label: "Notifications", href: "/vendor/notifications", icon: "notifications" },
  { label: "Store Settings", href: "/vendor/settings", icon: "settings" },
];

export function VendorMobileNavBar() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count from single source of truth
  useEffect(() => {
    let isMounted = true;

    fetchVendorNotificationsApi().then((res) => {
      if (isMounted && res.ok) {
        setUnreadCount(res.unreadCount);
      }
    });

    const timer = setInterval(() => {
      fetchVendorNotificationsApi().then((res) => {
        if (isMounted && res.ok) {
          setUnreadCount(res.unreadCount);
        }
      });
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [pathname]);

  // Active state determination
  const isDashboardActive = pathname === "/vendor";
  const isOrdersActive = pathname === "/vendor/orders";
  const isMenuActive = pathname === "/vendor/menu";
  const isMoreActive =
    !isDashboardActive && !isOrdersActive && !isMenuActive && pathname.startsWith("/vendor");

  return (
    <>
      {/* 1. Floating Dark Glassmorphism 4-Item Bottom Navigation Bar (Mobile Only) */}
      <nav
        aria-label="Vendor Mobile Navigation"
        className="z-40 mx-4 mt-2 shrink-0 rounded-full border border-white/[0.12] bg-[#0c0c0e]/85 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(255,122,0,0.08)] sm:hidden transition-all duration-200 mb-[max(0.75rem,var(--safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-4 items-center justify-items-center h-[64px] px-2 text-center">
          {/* Dashboard */}
          <Link
            href="/vendor"
            className={`flex h-[48px] w-full flex-col items-center justify-center gap-0.5 rounded-full px-1 transition-all active:scale-95 cursor-pointer ${
              isDashboardActive
                ? "bg-primary/20 text-primary border border-primary/30 font-extrabold shadow-[0_0_12px_rgba(255,122,0,0.25)]"
                : "text-zinc-400 hover:text-white border border-transparent"
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={isDashboardActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              dashboard
            </span>
            <span className="text-[10px] font-display font-bold leading-tight">Dashboard</span>
          </Link>

          {/* Orders */}
          <Link
            href="/vendor/orders"
            className={`flex h-[48px] w-full flex-col items-center justify-center gap-0.5 rounded-full px-1 transition-all active:scale-95 cursor-pointer ${
              isOrdersActive
                ? "bg-primary/20 text-primary border border-primary/30 font-extrabold shadow-[0_0_12px_rgba(255,122,0,0.25)]"
                : "text-zinc-400 hover:text-white border border-transparent"
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={isOrdersActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              soup_kitchen
            </span>
            <span className="text-[10px] font-display font-bold leading-tight">Orders</span>
          </Link>

          {/* Menu */}
          <Link
            href="/vendor/menu"
            className={`flex h-[48px] w-full flex-col items-center justify-center gap-0.5 rounded-full px-1 transition-all active:scale-95 cursor-pointer ${
              isMenuActive
                ? "bg-primary/20 text-primary border border-primary/30 font-extrabold shadow-[0_0_12px_rgba(255,122,0,0.25)]"
                : "text-zinc-400 hover:text-white border border-transparent"
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={isMenuActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              restaurant_menu
            </span>
            <span className="text-[10px] font-display font-bold leading-tight">Menu</span>
          </Link>

          {/* More Button */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className={`relative flex h-[48px] w-full flex-col items-center justify-center gap-0.5 rounded-full px-1 transition-all active:scale-95 cursor-pointer ${
              isMoreActive
                ? "bg-primary/20 text-primary border border-primary/30 font-extrabold shadow-[0_0_12px_rgba(255,122,0,0.25)]"
                : "text-zinc-400 hover:text-white border border-transparent"
            }`}
          >
            <div className="relative flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[20px]"
                style={isMoreActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                grid_view
              </span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 flex h-2 w-2 rounded-full bg-primary ring-2 ring-black" />
              )}
            </div>
            <span className="text-[10px] font-display font-bold leading-tight">More</span>
          </button>
        </div>
      </nav>

      {/* 2. More Vendor Modules Bottom Sheet */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-in fade-in sm:hidden">
          {/* Backdrop Click Dismiss */}
          <div
            className="flex-1 w-full"
            onClick={() => setIsMoreOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet Body */}
          <div className="w-full rounded-t-3xl border-t border-white/10 bg-surface-elevated p-5 pb-[calc(var(--safe-area-inset-bottom)+1.5rem)] shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Handle Drag Bar */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />

            {/* Header */}
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  grid_view
                </span>
                <h3 className="font-display text-title font-bold text-foreground">
                  Vendor Modules
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                aria-label="Close menu"
                className="rounded-xl p-1.5 text-muted hover:bg-background hover:text-foreground transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* 2-Column Grid of Remaining Modules */}
            <div className="grid grid-cols-2 gap-3">
              {MORE_GRID_ITEMS.map((item) => {
                const isSubItemActive =
                  pathname === item.href ||
                  (item.href !== "/vendor" && pathname.startsWith(item.href));
                const isNotificationItem = item.href === "/vendor/notifications";

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={`relative flex min-h-[52px] items-center gap-3 rounded-2xl border p-3.5 transition-all ${
                      isSubItemActive
                        ? "border-primary/50 bg-primary/15 text-primary font-bold shadow-glow-primary"
                        : "border-border/60 bg-background/50 text-foreground hover:bg-background"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[22px] ${
                        isSubItemActive ? "text-primary" : "text-muted"
                      }`}
                    >
                      {item.icon}
                    </span>

                    <span className="font-display text-caption font-bold line-clamp-1 flex-1">
                      {item.label}
                    </span>

                    {isNotificationItem && unreadCount > 0 && (
                      <span className="rounded-full bg-primary px-2 py-0.5 font-display text-[10px] font-extrabold text-on-primary shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
