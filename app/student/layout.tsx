import { RoleShellTabBar, type NavItem } from "@/components/shared/RoleShellNav";
import { CartProvider } from "@/lib/cart/CartContext";

const STUDENT_NAV: NavItem[] = [
  { label: "Home", href: "/student", icon: "storefront" },
  { label: "Orders", href: "/student/orders", icon: "receipt_long" },
  { label: "Wallet", href: "/student/wallet", icon: "account_balance_wallet" },
  { label: "Profile", href: "/student/profile", icon: "person" },
];

// Structural shell for the Student role. Route-group layout — does not
// itself render a URL segment. Auth/role enforcement happens in middleware,
// not here (see middleware.ts) — this layout assumes an authorized student.
//
// CartProvider is mounted here (Day 3) rather than per-page so Menu and
// Checkout — both under this layout — share one cart instance instead of
// each holding its own copy.
export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="min-h-dvh bg-background pb-20">
        {children}
        <RoleShellTabBar items={STUDENT_NAV} />
      </div>
    </CartProvider>
  );
}
