import { RoleShellRail, RoleShellTabBar, type NavItem } from "@/components/shared/RoleShellNav";

const VENDOR_NAV: NavItem[] = [
  { label: "Active Orders", href: "/vendor", icon: "soup_kitchen" },
  { label: "Menu", href: "/vendor/menu", icon: "restaurant_menu" },
  { label: "Notifications", href: "/vendor/notifications", icon: "notifications" },
  { label: "Analytics & Payouts", href: "/vendor/analytics", icon: "monitoring" },
];

// Structural shell for the Vendor role. Rail layout, not a tab bar: the vendor
// counter runs on a tablet as often as a phone (PRD 3.2, "the counter is
// sacred"), so navigation must never disappear at any width.
export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-background">
      <div className="hidden sm:flex">
        <RoleShellRail items={VENDOR_NAV} title="GrabIt Vendor" />
      </div>
      <div className="w-full flex-1 overflow-x-hidden pb-20 sm:pb-0 sm:overflow-x-auto">
        {children}
      </div>
      <div className="sm:hidden">
        <RoleShellTabBar items={VENDOR_NAV} />
      </div>
    </div>
  );
}
