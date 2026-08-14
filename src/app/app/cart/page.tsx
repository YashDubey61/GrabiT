"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import { useAuth } from "@/lib/store/auth";
import { TimeSlot } from "@/lib/types/database";
import { PriceTag } from "@/components/ui/PriceTag";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { SlotPicker } from "@/components/ui/SlotPicker";
import { calculateFees } from "@/lib/utils/fees";
import { formatPrice } from "@/lib/constants";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CartPage() {
  const cart = useCart();
  const { student } = useAuth();
  const router = useRouter();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "wallet">("upi");
  const [loading, setLoading] = useState(false);

  const fees = calculateFees(
    cart.subtotalPaise,
    student?.is_gold_subscriber ?? false
  );
  const grandTotal = cart.subtotalPaise + fees.studentFee;

  useEffect(() => {
    if (cart.canteenId) {
      fetch(`/api/canteens/${cart.canteenId}/menu`)
        .then((r) => r.json())
        .then((data) => setTimeSlots(data.timeSlots || []));
    }
  }, [cart.canteenId]);

  const handleCheckout = async () => {
    if (!student || !cart.timeSlotId || cart.items.length === 0) return;
    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student.id,
          canteen_id: cart.canteenId,
          time_slot_id: cart.timeSlotId,
          payment_method: paymentMethod,
          is_gold: student.is_gold_subscriber,
          items: cart.items.map((i) => ({
            menu_item_id: i.menu_item.id,
            name: i.menu_item.name,
            quantity: i.quantity,
            unit_price: i.menu_item.price,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        cart.clearCart();
        router.push(`/app/orders/${data.order.id}`);
      }
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="Your cart is empty"
        description="Browse a canteen menu and add items to get started."
        action={
          <Link
            href="/app"
            className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-bg hover:bg-accent-dim transition-colors"
          >
            Browse Canteens
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-bg/90 backdrop-blur-xl border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-2 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">Your Cart</h1>
          <button
            onClick={() => cart.clearCart()}
            className="ml-auto text-xs text-text-muted hover:text-error transition-colors"
          >
            Clear
          </button>
        </div>
      </header>

      <div className="flex-1 px-4 py-5 space-y-6">
        {/* Cart Items */}
        <div className="space-y-4 stagger-children">
          {cart.items.map((item) => (
            <div
              key={item.menu_item.id}
              className="flex items-center gap-4 rounded-xl bg-surface p-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate">
                  {item.menu_item.name}
                </h3>
                <PriceTag paise={item.menu_item.price} size="sm" />
              </div>
              <QuantityStepper
                value={item.quantity}
                onChange={(v) =>
                  cart.updateQuantity(item.menu_item.id, v)
                }
              />
              <div className="w-16 text-right">
                <PriceTag
                  paise={item.menu_item.price * item.quantity}
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Time Slot */}
        <div>
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
            Pickup Slot
          </h2>
          <SlotPicker
            slots={timeSlots}
            selectedId={cart.timeSlotId}
            onSelect={cart.setTimeSlot}
          />
        </div>

        {/* Payment Method */}
        <div>
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
            Payment
          </h2>
          <div className="flex gap-3">
            {(["upi", "wallet"] as const).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`
                  flex-1 rounded-xl border px-4 py-3 transition-all duration-200
                  ${
                    paymentMethod === method
                      ? "border-accent bg-accent/10 shadow-[0_0_0_1px_theme(colors.accent)]"
                      : "border-border bg-surface hover:border-accent/40"
                  }
                `}
              >
                <p className={`text-sm font-semibold ${paymentMethod === method ? "text-accent" : "text-text"}`}>
                  {method === "upi" ? "UPI / Razorpay" : "GrabIt Wallet"}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {method === "upi" ? "Pay via UPI" : "Use wallet balance"}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Bill Summary */}
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Bill Summary
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Subtotal</span>
              <PriceTag paise={cart.subtotalPaise} size="sm" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">
                Platform fee
                {student?.is_gold_subscriber && (
                  <span className="ml-1 text-accent text-xs">Gold ✓</span>
                )}
              </span>
              {fees.studentFee > 0 ? (
                <PriceTag paise={fees.studentFee} size="sm" />
              ) : (
                <span className="text-xs font-mono text-success">FREE</span>
              )}
            </div>
            <div className="h-px bg-border my-1" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Total</span>
              <PriceTag paise={grandTotal} size="md" />
            </div>
          </div>
        </div>
      </div>

      {/* Checkout button */}
      <div className="sticky bottom-20 px-4 pb-4">
        <button
          onClick={handleCheckout}
          disabled={!cart.timeSlotId || loading}
          className="
            w-full rounded-2xl bg-accent px-6 py-4
            text-bg font-semibold text-base
            transition-all duration-200
            hover:bg-accent-dim active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed
            shadow-[0_8px_32px_rgba(255,109,0,0.3)]
          "
        >
          {loading
            ? "Placing order..."
            : !cart.timeSlotId
              ? "Select a pickup slot"
              : `Pay ${formatPrice(grandTotal)}`}
        </button>
      </div>
    </div>
  );
}
