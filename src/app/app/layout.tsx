import { AppShell } from "@/components/layout/AppShell";
import { CartProvider } from "@/lib/store/cart";
import { AuthProvider } from "@/lib/store/auth";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <CartProvider>
        <AppShell>{children}</AppShell>
      </CartProvider>
    </AuthProvider>
  );
}
