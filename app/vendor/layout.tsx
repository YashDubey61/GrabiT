import { RoleShellRail, type NavItem } from "@/components/shared/RoleShellNav";

const VENDOR_NAV: NavItem[] = [
  { label: "Active Orders", href: "/vendor", icon: "soup_kitchen" },
  { label: "Menu", href: "/vendor/menu", icon: "restaurant_menu" },
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
      <RoleShellRail items={VENDOR_NAV} title="GrabIt Vendor" />
      <div className="flex-1 overflow-x-auto">{children}</div>
    </div>
  );
}
