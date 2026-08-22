"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckoutHeader } from "@/components/student/CheckoutHeader";
import { CheckoutOrderSummary } from "@/components/student/CheckoutOrderSummary";
import { PickupSlotSelector, type PickupSlot } from "@/components/student/PickupSlotSelector";
import { PaymentMethodSelector, type PaymentMethod } from "@/components/student/PaymentMethodSelector";
import { CheckoutAction } from "@/components/student/CheckoutAction";
import { EmptyCheckoutState } from "@/components/student/EmptyCheckoutState";
import { PromoCodeSection, type AppliedPromo } from "@/components/student/PromoCodeSection";
import { TrackEventOnMount } from "@/components/shared/TrackEventOnMount";
import { trackProductEvent } from "@/lib/analytics/events";
import { useCart } from "@/lib/cart/CartContext";
import { openCashfreeCheckout } from "@/lib/payments/cashfree_client";
import { playOrderPlacedSound } from "@/lib/student/orderPlacedSound";

type PaymentPhase = "idle" | "preparing" | "processing" | "pending" | "failed";

export default function StudentCheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const [slot, setSlot] = useState<PickupSlot>("ASAP");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentPhase, setPaymentPhase] = useState<PaymentPhase>("idle");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);

  if (cart.items.length === 0) {
    return <EmptyCheckoutState />;
  }

  async function pollPaymentStatus(orderId: string, attempts = 0): Promise<void> {
    if (attempts >= 8) {
      setPaymentPhase("pending");
      setIsSubmitting(false);
      router.push(`/customer/orders/${orderId}`);
      return;
    }
    try {
      const res = await fetch(`/api/payments/cashfree/status?orderId=${orderId}`);
      const data = await res.json().catch(() => null);
      if (data && data.ok && data.paymentStatus === "success") {
        cart.clearCart();
        playOrderPlacedSound(orderId);
        router.push(`/customer/orders/${orderId}`);
        return;
      }
      if (data && data.ok && data.paymentStatus === "failed") {
        setPaymentPhase("failed");
        setError("Payment failed. Please try again.");
        setIsSubmitting(false);
        return;
      }
    } catch {
      // Retry below
    }
    await new Promise((r) => setTimeout(r, 1500));
    return pollPaymentStatus(orderId, attempts + 1);
  }

  async function handlePlaceOrder() {
    if (!cart || !cart.items || cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!cart.canteenId || !cart.canteenName) {
      setError("Something went wrong with your cart. Please try again.");
      return;
    }
    if (isSubmitting) return; // Prevents double taps or repeated clicks.

    const sanitizedItems = (cart.items ?? [])
      .filter((item) => item && item.menuItemId && Number.isInteger(item.quantity) && item.quantity > 0)
      .map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity }));

    if (sanitizedItems.length === 0) {
      setError("Your cart contains no valid items.");
      return;
    }

    trackProductEvent({ eventName: "checkout_submitted", canteenId: cart.canteenId });
    setIsSubmitting(true);
    setError(null);
    setPaymentPhase("idle");

    if (paymentMethod === "card") {
      setPaymentPhase("preparing");
      try {
        const res = await fetch("/api/payments/cashfree/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            canteenId: cart.canteenId,
            canteenName: cart.canteenName,
            slot,
            items: sanitizedItems,
            promoCode: appliedPromo?.codeType === "PROMO" ? appliedPromo.code : null,
            rewardCode: appliedPromo?.codeType === "REWARD" ? appliedPromo.code : null,
          }),
        });

        const result = await res.json().catch(() => null);

        if (!res.ok || !result || !result.ok) {
          setError(result?.error || "Payment couldn't be started. Please try again.");
          setPaymentPhase("failed");
          setIsSubmitting(false);
          return;
        }

        if (result.skippedPayment && result.orderId) {
          cart.clearCart();
          playOrderPlacedSound(result.orderId);
          router.push(`/customer/orders/${result.orderId}`);
          return;
        }

        if (!result.paymentSessionId || !result.orderId) {
          setError("Payment couldn't be started. Invalid session response.");
          setPaymentPhase("failed");
          setIsSubmitting(false);
          return;
        }

        setPaymentPhase("processing");
        const checkoutRes = await openCashfreeCheckout(
          result.paymentSessionId,
          result.paymentMode === "PRODUCTION" ? "production" : "sandbox",
        );

        if (checkoutRes?.error) {
          setError(checkoutRes.error.message || "Payment cancelled.");
          setPaymentPhase("failed");
          setIsSubmitting(false);
          return;
        }

        await pollPaymentStatus(result.orderId);
      } catch (err) {
        console.error("Cashfree checkout error:", err);
        setError("Payment couldn't be started. Please try again.");
        setPaymentPhase("failed");
        setIsSubmitting(false);
      }
      return;
    }

    // Wallet Payment Flow
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canteenId: cart.canteenId,
          canteenName: cart.canteenName,
          slot,
          paymentMethod,
          items: sanitizedItems,
          promoCode: appliedPromo?.codeType === "PROMO" ? appliedPromo.code : null,
          rewardCode: appliedPromo?.codeType === "REWARD" ? appliedPromo.code : null,
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result || !result.ok || !result.order || !result.order.id) {
        setError(result?.error || "Failed to place order. Please try again.");
        setIsSubmitting(false);
        setPaymentPhase("failed");
        return;
      }

      cart.clearCart();
      playOrderPlacedSound(result.order.id);
      router.push(`/customer/orders/${result.order.id}`);
    } catch (err) {
      console.error("Wallet checkout error:", err);
      setError("Network error. Please try again.");
      setIsSubmitting(false);
      setPaymentPhase("failed");
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

        {cart.canteenId && (
          <PromoCodeSection
            canteenId={cart.canteenId}
            items={cart.items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity }))}
            applied={appliedPromo}
            onApplied={setAppliedPromo}
            onRemove={() => setAppliedPromo(null)}
          />
        )}

        {paymentPhase === "preparing" && (
          <p className="rounded-xl border border-border-subtle bg-surface-elevated p-3 text-center text-caption text-muted">Preparing payment…</p>
        )}
        {paymentPhase === "processing" && (
          <p className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-center text-caption text-primary">Processing your payment…</p>
        )}
        {paymentPhase === "pending" && (
          <p className="rounded-xl border border-warning/30 bg-warning-soft p-3 text-center text-caption text-warning">
            Payment is still being confirmed — check your order for updates.
          </p>
        )}
      </main>

      <CheckoutAction
        subtotal={cart.subtotal}
        promoCode={appliedPromo?.code}
        discount={appliedPromo?.discountAmount ?? 0}
        discountLabel={appliedPromo?.codeType === "REWARD" ? "Reward Discount" : "Promo Discount"}
        onPlaceOrder={handlePlaceOrder}
        error={error}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
