"use client";

import { useState, useEffect } from "react";
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
import { getLiveWalletForStudent } from "@/lib/supabase/wallet";

type PaymentPhase = "idle" | "preparing" | "processing" | "pending" | "failed";

// Survives an Android Activity recreation (backgrounding a Capacitor app
// during an external UPI app switch can get the WebView's whole JS
// context torn down and recreated) — a purely in-memory poll loop would
// otherwise lose track of an in-flight Cashfree order entirely, leaving
// the student with no way to recover its outcome except starting over.
const PENDING_ORDER_KEY = "grabit_pending_cashfree_order";
const PENDING_ORDER_MAX_AGE_MS = 30 * 60 * 1000;

function savePendingCashfreeOrder(orderId: string) {
  try {
    localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({ orderId, createdAt: Date.now() }));
  } catch {
    // Non-critical — worst case, resume recovery just has nothing to check.
  }
}

function clearPendingCashfreeOrder() {
  try {
    localStorage.removeItem(PENDING_ORDER_KEY);
  } catch {
    // Non-critical.
  }
}

function readPendingCashfreeOrder(): string | null {
  try {
    const raw = localStorage.getItem(PENDING_ORDER_KEY);
    if (!raw) return null;
    const { orderId, createdAt } = JSON.parse(raw) as { orderId: string; createdAt: number };
    if (!orderId || Date.now() - createdAt > PENDING_ORDER_MAX_AGE_MS) {
      localStorage.removeItem(PENDING_ORDER_KEY);
      return null;
    }
    return orderId;
  } catch {
    return null;
  }
}

export default function StudentCheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const [slot, setSlot] = useState<PickupSlot>("ASAP");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentPhase, setPaymentPhase] = useState<PaymentPhase>("idle");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | undefined>(undefined);
  // Set only when polling gives up without a terminal SUCCESS/FAILED —
  // i.e. the student closed/dropped Cashfree checkout, or the payment is
  // genuinely still resolving. The order was never marked paid (backend
  // is the only thing that can do that), so this is a recoverable state,
  // not a silent redirect implying the order is fine.
  const [unresolvedOrderId, setUnresolvedOrderId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getLiveWalletForStudent().then((wallet) => {
      if (isMounted) setWalletBalance(wallet.balance);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Recover an in-flight Cashfree payment that survived an app restart
  // or Activity recreation, by resuming the same bounded status poll —
  // so a student who left mid-payment and reopens GRABIT sees the real
  // outcome instead of a blank checkout page with no memory of it.
  useEffect(() => {
    const pendingOrderId = readPendingCashfreeOrder();
    if (pendingOrderId) {
      setIsSubmitting(true);
      setPaymentPhase("processing");
      void pollPaymentStatus(pendingOrderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While a payment is unresolved, an app foreground (e.g. returning from
  // Cashfree/a UPI app) should re-check status immediately rather than
  // waiting out the poll loop's fixed interval.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const activeOrderId = unresolvedOrderId ?? readPendingCashfreeOrder();
    if (!activeOrderId) return;

    let removeListener: (() => void) | undefined;
    import("@capacitor/app")
      .then(({ App }) =>
        App.addListener("resume", () => {
          void pollPaymentStatus(activeOrderId);
        }),
      )
      .then((listener) => {
        removeListener = () => listener.remove();
      })
      .catch(() => {
        // Not running natively — no-op.
      });

    return () => removeListener?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unresolvedOrderId]);

  if (cart.items.length === 0) {
    return <EmptyCheckoutState />;
  }

  async function pollPaymentStatus(orderId: string, attempts = 0): Promise<void> {
    if (attempts >= 10) {
      // Backend never reached a terminal state within the poll window —
      // this is exactly what happens when the student drops/cancels
      // Cashfree checkout (Cashfree's own order stays ACTIVE, not PAID,
      // for a long time) or a payment is genuinely still resolving.
      // The order/payment rows are untouched (still "placed"/"pending"
      // in the DB — never flipped to paid client-side), so this must
      // stay a recoverable state: no silent navigation implying success,
      // cart kept intact so Retry Payment can re-submit.
      setPaymentPhase("pending");
      setIsSubmitting(false);
      setUnresolvedOrderId(orderId);
      return;
    }
    try {
      const res = await fetch(`/api/payments/cashfree/status?orderId=${orderId}`);
      const data = await res.json().catch(() => null);
      if (data && data.ok && data.paymentStatus === "success") {
        clearPendingCashfreeOrder();
        cart.clearCart();
        playOrderPlacedSound(orderId);
        router.push(`/customer/orders/${orderId}`);
        return;
      }
      if (data && data.ok && data.paymentStatus === "failed") {
        clearPendingCashfreeOrder();
        setPaymentPhase("failed");
        setError("Payment failed. Please try again.");
        setIsSubmitting(false);
        return;
      }
    } catch {
      // Retry below
    }
    await new Promise((r) => setTimeout(r, 2000));
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

        // Persisted before opening the Cashfree UI — if the Activity gets
        // torn down mid-payment (e.g. backgrounded during a UPI app
        // switch and reclaimed by Android), this order id survives to be
        // recovered on the next mount instead of vanishing with it.
        savePendingCashfreeOrder(result.orderId);

        setPaymentPhase("processing");
        const checkoutRes = await openCashfreeCheckout(
          result.paymentSessionId,
          result.paymentMode === "PRODUCTION" ? "production" : "sandbox",
        );

        if (checkoutRes?.error) {
          // The SDK's own error is UI messaging only — it never touches
          // the order/payment rows, so it can never overwrite a real
          // success the backend later confirms via webhook. The order
          // details page always reads the authoritative DB state
          // directly, independent of what this transient message says.
          clearPendingCashfreeOrder();
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

      <main className="mx-auto max-w-2xl space-y-6 px-5 pb-40 pt-6 md:px-16 md:pt-8">
        <CheckoutOrderSummary items={cart.items} pickupSlot={slot} />
        <PickupSlotSelector selected={slot} onSelect={setSlot} />
        <PaymentMethodSelector selected={paymentMethod} onSelect={setPaymentMethod} walletBalance={walletBalance} />

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
        {paymentPhase === "pending" && unresolvedOrderId && (
          <div className="rounded-xl border border-warning/30 bg-warning-soft p-4 text-center space-y-3">
            <p className="text-caption text-warning">
              We couldn&apos;t confirm your payment yet. If you completed it in Cashfree, it may still
              be processing — check your order for updates. If you cancelled or closed Cashfree, your
              order has not been charged.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => router.push(`/customer/orders/${unresolvedOrderId}`)}
                className="rounded-full border border-warning/40 px-4 py-2 text-caption font-bold text-warning"
              >
                View Order Status
              </button>
              <button
                type="button"
                onClick={() => {
                  clearPendingCashfreeOrder();
                  setPaymentPhase("idle");
                  setUnresolvedOrderId(null);
                  setError(null);
                }}
                className="rounded-full bg-primary px-4 py-2 text-caption font-bold text-on-primary"
              >
                Retry Payment
              </button>
            </div>
          </div>
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
