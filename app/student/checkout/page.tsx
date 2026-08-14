"use client";

import { useState } from "react";
import { CheckoutHeader } from "@/components/student/CheckoutHeader";
import { CheckoutOrderSummary } from "@/components/student/CheckoutOrderSummary";
import { PickupSlotSelector, type PickupSlot } from "@/components/student/PickupSlotSelector";
import { PaymentMethodSelector, type PaymentMethod } from "@/components/student/PaymentMethodSelector";
import { CheckoutBillDetails } from "@/components/student/CheckoutBillDetails";
import { CheckoutAction } from "@/components/student/CheckoutAction";
import { EmptyCheckoutState } from "@/components/student/EmptyCheckoutState";
import { useCart } from "@/lib/cart/CartContext";

// Client Component — converted from
// stitch_grabit_campus_canteen_os/grabit_checkout_premium_black/code.html.
// Everything here either reads the shared cart (useCart) or holds local-only
// UI state (pickup slot, payment method) — neither exists on the server,
// so unlike Campus Home/Menu this page has no server-rendered shell to
// split out.
export default function StudentCheckoutPage() {
  const cart = useCart();
  const [slot, setSlot] = useState<PickupSlot>("ASAP");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");

  if (cart.items.length === 0) {
    return <EmptyCheckoutState />;
  }

  return (
    <>
      <CheckoutHeader />

      <main className="mx-auto max-w-2xl space-y-6 px-5 pb-48 pt-20 md:px-16 md:pt-24">
        <CheckoutOrderSummary items={cart.items} pickupSlot={slot} />
        <PickupSlotSelector selected={slot} onSelect={setSlot} />
        <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} />
        <CheckoutBillDetails subtotal={cart.subtotal} />
      </main>

      <CheckoutAction subtotal={cart.subtotal} />
    </>
  );
}
