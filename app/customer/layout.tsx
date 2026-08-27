import { RoleShellTabBar, type NavItem } from "@/components/shared/RoleShellNav";
import { StudentPushInit } from "@/components/student/StudentPushInit";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { CartProvider } from "@/lib/cart/CartContext";
import { OrderProvider } from "@/lib/orders/OrderContext";

const STUDENT_NAV: NavItem[] = [
  { label: "Home", href: "/customer", icon: "storefront" },
  { label: "Orders", href: "/customer/orders", icon: "receipt_long" },
  { label: "Wallet", href: "/customer/wallet", icon: "account_balance_wallet" },
  { label: "Profile", href: "/customer/profile", icon: "person" },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <OrderProvider>
        <StudentPushInit />
        <div className="relative min-h-dvh w-full overflow-x-hidden bg-[#050505] text-foreground">
          <AnimatedBackground intensity="subtle" />
          <div className="relative z-10 w-full min-h-dvh">
            {children}
          </div>
          <RoleShellTabBar items={STUDENT_NAV} />
        </div>
      </OrderProvider>
    </CartProvider>
  );
}
