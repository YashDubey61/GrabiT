"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckoutHeader } from "@/components/student/CheckoutHeader";
import { CheckoutOrderSummary } from "@/components/student/CheckoutOrderSummary";
import { PickupSlotSelector, type PickupSlot } from "@/components/student/PickupSlotSelector";
import { PaymentMethodSelector, type PaymentMethod } from "@/components/student/PaymentMethodSelector";
import { CheckoutBillDetails } from "@/components/student/CheckoutBillDetails";
import { CheckoutAction } from "@/components/student/CheckoutAction";
import { EmptyCheckoutState } from "@/components/student/EmptyCheckoutState";
import { useCart } from "@/lib/cart/CartContext";
import { useOrders } from "@/lib/orders/OrderContext";

// Client Component — converted from
// stitch_grabit_campus_canteen_os/grabit_checkout_premium_black/code.html.
export default function StudentCheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const orders = useOrders();
  const [slot, setSlot] = useState<PickupSlot>("ASAP");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");
  const [error, setError] = useState<string | null>(null);

  if (cart.items.length === 0) {
    return <EmptyCheckoutState />;
  }

  // Day 4: "Pay & Place Order" creates a real (mock, local-only) order.
  // Sequence matters — cart is cleared only *after* order creation
  // succeeds, so a validation failure never loses the student's cart.
  function handlePlaceOrder() {
    if (!cart.canteenId || !cart.canteenName) {
      setError("Something went wrong with your cart. Please try again.");
      return;
    }

    const result = orders.createOrder({
      canteenId: cart.canteenId,
      canteenName: cart.canteenName,
      items: cart.items,
      slot,
      paymentMethod,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    cart.clearCart();
    router.push(`/student/orders/${result.order.id}`);
  }

  return (
    <>
      <CheckoutHeader />

      <main className="mx-auto max-w-2xl space-y-6 px-5 pb-56 pt-20 md:px-16 md:pt-24">
        <CheckoutOrderSummary items={cart.items} pickupSlot={slot} />
        <PickupSlotSelector selected={slot} onSelect={setSlot} />
        <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />
        <CheckoutBillDetails subtotal={cart.subtotal} />
      </main>

      <CheckoutAction subtotal={cart.subtotal} onPlaceOrder={handlePlaceOrder} error={error} />
    </>
  );
}
