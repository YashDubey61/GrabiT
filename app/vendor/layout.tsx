"use client";

import { usePathname } from "next/navigation";
import { RoleShellRail, type NavItem } from "@/components/shared/RoleShellNav";
import { VendorMobileNavBar } from "@/components/vendor/VendorMobileNavBar";

export const VENDOR_NAV: NavItem[] = [
  { label: "Dashboard", href: "/vendor", icon: "dashboard" },
  { label: "Live Orders", href: "/vendor/orders", icon: "soup_kitchen" },
  { label: "Menu", href: "/vendor/menu", icon: "restaurant_menu" },
  { label: "Inventory", href: "/vendor/inventory", icon: "inventory_2" },
  { label: "Offers & Promos", href: "/vendor/offers", icon: "local_offer" },
  { label: "Analytics", href: "/vendor/analytics", icon: "monitoring" },
  { label: "Payouts & Finance", href: "/vendor/payouts", icon: "account_balance_wallet" },
  { label: "Reviews & Ratings", href: "/vendor/reviews", icon: "star" },
  { label: "Notifications", href: "/vendor/notifications", icon: "notifications" },
  { label: "Store Settings", href: "/vendor/settings", icon: "settings" },
];

/**
 * Structural shell for the Vendor role.
 * Navigation rail/tabbar is rendered ONLY for authenticated dashboard routes (/vendor/*),
 * and completely excluded from the standalone vendor authentication page (/vendor/auth).
 */
export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/vendor/auth";

  if (isAuthPage) {
    return <main className="min-h-dvh w-full bg-background">{children}</main>;
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <div className="hidden sm:flex">
        <RoleShellRail items={VENDOR_NAV} title="GrabIt Vendor" />
      </div>
      <div className="w-full flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden pb-28 sm:pb-0 sm:overflow-x-auto">
        {children}
      </div>
      <div className="sm:hidden">
        <VendorMobileNavBar />
      </div>
    </div>
  );
}
