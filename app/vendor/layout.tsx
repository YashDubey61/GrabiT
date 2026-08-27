"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RoleShellRail, type NavItem } from "@/components/shared/RoleShellNav";
import { VendorMobileNavBar } from "@/components/vendor/VendorMobileNavBar";
import { VendorProvider } from "@/lib/vendor/VendorContext";
import { getPendingOrderNavigation, onOrderNotificationTapped } from "@/lib/vendor/orderAlertService";
import { DashboardBackground } from "@/components/ui/dashboard-background";
import { VendorExitModal } from "@/components/vendor/VendorExitModal";

/**
 * A new-order notification's PendingIntent only relaunches MainActivity —
 * it never targets a specific route, so the WebView stays wherever the
 * vendor last left it. The order-open listener that actually resolves the
 * tapped order lives on /vendor/orders, so a tap landing on any other
 * vendor screen (Dashboard, Menu, ...) would otherwise be silently
 * swallowed. This forces navigation to Orders on tap/cold-launch from
 * anywhere in the vendor app; /vendor/orders itself then resolves the
 * specific order id once its own listener (and live order data) are ready.
 */
function useNotificationDeepLinkRedirect() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const router = useRouter();

  useEffect(() => {
    const goToOrders = () => {
      if (pathnameRef.current !== "/vendor/orders") {
        router.push("/vendor/orders");
      }
    };

    getPendingOrderNavigation().then((res) => {
      if (res.pending && res.orderId) goToOrders();
    });

    let cleanup: (() => void) | null = null;
    onOrderNotificationTapped((data) => {
      if (data?.orderId) goToOrders();
    }).then((unsub) => {
      cleanup = unsub;
    });

    return () => {
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

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

  useNotificationDeepLinkRedirect();

  if (isAuthPage) {
    return (
      <main className="min-h-dvh w-full bg-[#050505] text-foreground">
        {children}
        <VendorExitModal />
      </main>
    );
  }

  return (
    <VendorProvider>
      <div className="relative flex h-dvh overflow-hidden bg-[#050505] text-foreground">
        <DashboardBackground intensity="subtle" />
        <div className="relative z-10 hidden sm:flex">
          <RoleShellRail items={VENDOR_NAV} title="GrabIt Vendor" />
        </div>
        <div className="relative z-10 flex min-w-0 max-w-full flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain sm:overflow-x-auto">
            {children}
          </div>
          <div className="sm:hidden">
            <VendorMobileNavBar />
          </div>
        </div>
        <VendorExitModal />
      </div>
    </VendorProvider>
  );
}

