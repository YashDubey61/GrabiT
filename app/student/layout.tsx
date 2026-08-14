import { RoleShellTabBar, type NavItem } from "@/components/shared/RoleShellNav";

const STUDENT_NAV: NavItem[] = [
  { label: "Home", href: "/student", icon: "storefront" },
  { label: "Orders", href: "/student/orders", icon: "receipt_long" },
  { label: "Wallet", href: "/student/wallet", icon: "account_balance_wallet" },
  { label: "Profile", href: "/student/profile", icon: "person" },
];

// Structural shell for the Student role. Route-group layout — does not
// itself render a URL segment. Auth/role enforcement happens in middleware,
// not here (see middleware.ts) — this layout assumes an authorized student.
export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background pb-20">
      {children}
      <RoleShellTabBar items={STUDENT_NAV} />
    </div>
  );
}
