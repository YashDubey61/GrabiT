"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckoutHeader } from "@/components/student/CheckoutHeader";
import { CheckoutOrderSummary } from "@/components/student/CheckoutOrderSummary";
import { PickupSlotSelector, type PickupSlot } from "@/components/student/PickupSlotSelector";
import { PaymentMethodSelector, type PaymentMethod } from "@/components/student/PaymentMethodSelector";
import { CheckoutAction } from "@/components/student/CheckoutAction";
import { EmptyCheckoutState } from "@/components/student/EmptyCheckoutState";
import { TrackEventOnMount } from "@/components/shared/TrackEventOnMount";
import { trackProductEvent } from "@/lib/analytics/events";
import { useCart } from "@/lib/cart/CartContext";

// Client Component — converted from
// stitch_grabit_campus_canteen_os/grabit_checkout_premium_black/code.html.
export default function StudentCheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const [slot, setSlot] = useState<PickupSlot>("ASAP");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (cart.items.length === 0) {
    return <EmptyCheckoutState />;
  }

  // "Pay & Place Order" creates a real, server-persisted order via
  // POST /api/orders — the server re-validates items/prices from the DB
  // and is the sole source of truth for totals. Cart is cleared only
  // *after* order creation succeeds, so a failed submission never loses
  // the student's cart.
  async function handlePlaceOrder() {
    if (!cart.canteenId || !cart.canteenName) {
      setError("Something went wrong with your cart. Please try again.");
      return;
    }

    trackProductEvent({ eventName: "checkout_submitted", canteenId: cart.canteenId });
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canteenId: cart.canteenId,
          canteenName: cart.canteenName,
          slot,
          paymentMethod,
          items: cart.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          })),
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        setError(result.error || "Failed to place order. Please try again.");
        setIsSubmitting(false);
        return;
      }

      cart.clearCart();
      router.push(`/customer/orders/${result.order.id}`);
    } catch {
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <TrackEventOnMount payload={{ eventName: "checkout_started", canteenId: cart.canteenId ?? undefined }} />
      <CheckoutHeader />

      <main className="mx-auto max-w-2xl space-y-6 px-5 pb-40 pt-20 md:px-16 md:pt-24">
        <CheckoutOrderSummary items={cart.items} pickupSlot={slot} />
        <PickupSlotSelector selected={slot} onSelect={setSlot} />
        <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />
      </main>

      <CheckoutAction
        subtotal={cart.subtotal}
        onPlaceOrder={handlePlaceOrder}
        error={error}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
