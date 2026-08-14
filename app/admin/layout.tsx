import { RoleShellRail, type NavItem } from "@/components/shared/RoleShellNav";

const ADMIN_NAV: NavItem[] = [
  { label: "Global Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Campus Management", href: "/admin/campuses", icon: "school" },
  { label: "Vendor Oversight", href: "/admin/vendors", icon: "storefront" },
];

// Structural shell for the Super Admin role — the Platform Operator persona
// (PRD §3.3), desktop-first by nature of the job (running the business, not
// grabbing lunch between classes).
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-background">
      <RoleShellRail items={ADMIN_NAV} title="GrabIt Admin" />
      <div className="flex-1 overflow-x-auto">{children}</div>
    </div>
  );
}
