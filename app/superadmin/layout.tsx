"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { RoleShellRail, type NavItem } from "@/components/shared/RoleShellNav";
import { GlobalSearchModal } from "@/components/superadmin/search/GlobalSearchModal";
import { DashboardBackground } from "@/components/ui/dashboard-background";

const SUPERADMIN_NAV: NavItem[] = [
  { label: "Global Dashboard", href: "/superadmin", icon: "dashboard" },
  { label: "Global Search & Finder", href: "/superadmin/search", icon: "search" },
  { label: "User & Role Management", href: "/superadmin/users", icon: "manage_accounts" },
  { label: "Vendor Approval & KYC", href: "/superadmin/vendors/applications", icon: "verified" },
  { label: "Fraud & Risk Center", href: "/superadmin/risk", icon: "security" },
  { label: "Disputes & Refunds", href: "/superadmin/disputes", icon: "support_agent" },
  { label: "Customer Support Center", href: "/superadmin/support", icon: "headset_mic" },
  { label: "Financial Command Center", href: "/superadmin/finance", icon: "account_balance" },
  { label: "Platform Intelligence", href: "/superadmin/intelligence", icon: "insights" },
  { label: "Audit Logs & Activity", href: "/superadmin/audit-logs", icon: "receipt_long" },
  { label: "Platform Configuration", href: "/superadmin/configuration", icon: "settings" },
  { label: "Feature Flags & Rollouts", href: "/superadmin/feature-flags", icon: "flag" },
  { label: "Campus Management", href: "/superadmin/campuses", icon: "school" },
  { label: "Vendor Oversight", href: "/superadmin/vendors", icon: "storefront" },
  { label: "Vendor Performance", href: "/superadmin/vendor-performance", icon: "monitoring" },
  { label: "Ops Observability", href: "/superadmin/operations", icon: "insights" },
  { label: "Workflows", href: "/superadmin/workflows", icon: "account_tree" },
  { label: "Incidents", href: "/superadmin/incidents", icon: "warning" },
  { label: "On-Call Ops", href: "/superadmin/on-call", icon: "emergency" },
  { label: "System Health", href: "/superadmin/system-health", icon: "monitor_heart" },
  { label: "Disaster Recovery", href: "/superadmin/disaster-recovery", icon: "shield_with_heart" },
  { label: "Product Analytics", href: "/superadmin/analytics", icon: "analytics" },
  { label: "Notifications", href: "/superadmin/notifications", icon: "notifications" },
  { label: "Cashfree Payments", href: "/superadmin/cashfree-payments", icon: "credit_card" },
  { label: "Vendor Settlements", href: "/superadmin/settlements", icon: "payments" },
  { label: "GRABIT Financial Ledger", href: "/superadmin/wallet", icon: "account_balance" },
  { label: "Cashfree Payouts", href: "/superadmin/cashfree-payouts", icon: "account_balance_wallet" },
  { label: "Reconciliation", href: "/superadmin/reconciliation", icon: "balance" },
  { label: "Rewards Analytics", href: "/superadmin/rewards-analytics", icon: "redeem" },
  { label: "Promo Codes", href: "/superadmin/promo-codes", icon: "local_offer" },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/superadmin/auth";
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Global Command-K / Ctrl+K / '/' keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        if (pathname === "/superadmin/search") return;
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname]);

  if (isAuthPage) {
    return (
      <main className="relative min-h-dvh w-full overflow-x-hidden bg-[#070709] text-foreground">
        <DashboardBackground intensity="subtle" />
        <div className="relative z-10 w-full min-h-dvh">
          {children}
        </div>
      </main>
    );
  }

  return (
    <div className="relative flex h-dvh overflow-hidden bg-[#070709] text-foreground">
      <DashboardBackground intensity="subtle" />
      <div className="relative z-10 hidden sm:flex">
        <RoleShellRail items={SUPERADMIN_NAV} title="GrabIt Super Admin" />
      </div>
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-auto overscroll-contain">{children}</div>
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
