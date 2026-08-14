import { RoleShellRail, type NavItem } from "@/components/shared/RoleShellNav";

const SUPERADMIN_NAV: NavItem[] = [
  { label: "Global Dashboard", href: "/superadmin", icon: "dashboard" },
  { label: "Campus Management", href: "/superadmin/campuses", icon: "school" },
  { label: "Vendor Oversight", href: "/superadmin/vendors", icon: "storefront" },
];

// Structural shell for the Super Admin role — the Platform Operator persona
// (PRD §3.3), desktop-first by nature of the job (running the business, not
// grabbing lunch between classes).
//
// Day 3 correction: this route was named /admin through Day 1–2. The
// product has exactly three role surfaces — student, vendor, and
// Super Admin — and the canonical route is /superadmin, not /admin.
// A redirect from /admin is kept for compatibility (see next.config.ts).
export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-background">
      <RoleShellRail items={SUPERADMIN_NAV} title="GrabIt Super Admin" />
      <div className="flex-1 overflow-x-auto">{children}</div>
    </div>
  );
}
