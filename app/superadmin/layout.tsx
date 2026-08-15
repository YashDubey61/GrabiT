import { RoleShellRail, type NavItem } from "@/components/shared/RoleShellNav";

const SUPERADMIN_NAV: NavItem[] = [
  { label: "Global Dashboard", href: "/superadmin", icon: "dashboard" },
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
  { label: "Reconciliation", href: "/superadmin/reconciliation", icon: "balance" },
];

// Structural shell for the Super Admin role — the Platform Operator persona
// (PRD §3.3), desktop-first by nature of the job (running the business, not
// grabbing lunch between classes).
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
