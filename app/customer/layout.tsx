import { RoleShellTabBar, type NavItem } from "@/components/shared/RoleShellNav";
import { StudentPushInit } from "@/components/student/StudentPushInit";
import { CartProvider } from "@/lib/cart/CartContext";
import { OrderProvider } from "@/lib/orders/OrderContext";

const STUDENT_NAV: NavItem[] = [
  { label: "Home", href: "/customer", icon: "storefront" },
  { label: "Orders", href: "/customer/orders", icon: "receipt_long" },
  { label: "Wallet", href: "/customer/wallet", icon: "account_balance_wallet" },
  { label: "Profile", href: "/customer/profile", icon: "person" },
];

// Structural shell for the Student role. Route-group layout — does not
// itself render a URL segment. Auth/role enforcement happens in middleware,
// not here (see middleware.ts) — this layout assumes an authorized student.
//
// CartProvider is mounted here (Day 3) rather than per-page so Menu and
// Checkout — both under this layout — share one cart instance instead of
// each holding its own copy. OrderProvider (Day 4) follows the same
// reasoning: Checkout creates orders, Track Order (and Day 5's Order
// History) reads them — one store, not one per route.
export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <OrderProvider>
        <StudentPushInit />
        <div className="relative min-h-dvh w-full overflow-x-hidden bg-background">
          <div className="w-full min-h-dvh overflow-x-hidden">
            {children}
          </div>
          <RoleShellTabBar items={STUDENT_NAV} />
        </div>
      </OrderProvider>
    </CartProvider>
  );
}
