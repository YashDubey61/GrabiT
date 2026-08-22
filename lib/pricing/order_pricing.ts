/**
 * The single authoritative pricing calculation for GRABIT orders.
 * Client-safe (pure math, no imports) so the checkout UI, cart context,
 * and every order-creation API route all compute the exact same
 * numbers. The server is always the final authority — it recomputes
 * this from DB-sourced line items rather than trusting a client total.
 *
 * Rules (locked, not configurable per-order):
 * - platformFee: ₹2.50 flat when subtotal > ₹25, otherwise ₹0.
 * - deliveryCharge: always ₹0 — GRABIT does not charge delivery.
 */

const PLATFORM_FEE_THRESHOLD = 25;
const PLATFORM_FEE_AMOUNT = 2.5;

export interface OrderPricingInput {
  subtotal: number;
  discount?: number;
  rewardDiscount?: number;
}

export interface OrderPricing {
  subtotal: number;
  platformFee: number;
  deliveryCharge: number;
  discount: number;
  rewardDiscount: number;
  totalPayable: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateOrderPricing(input: OrderPricingInput | number): OrderPricing {
  const { subtotal, discount = 0, rewardDiscount = 0 } =
    typeof input === "number" ? { subtotal: input, discount: 0, rewardDiscount: 0 } : input;

  const safeSubtotal = Math.max(0, round2(subtotal));
  const platformFee = safeSubtotal > PLATFORM_FEE_THRESHOLD ? PLATFORM_FEE_AMOUNT : 0;
  const deliveryCharge = 0;
  const safeDiscount = Math.max(0, round2(discount));
  const safeRewardDiscount = Math.max(0, round2(rewardDiscount));

  const totalPayable = Math.max(
    0,
    round2(safeSubtotal + platformFee + deliveryCharge - safeDiscount - safeRewardDiscount),
  );

  return {
    subtotal: safeSubtotal,
    platformFee,
    deliveryCharge,
    discount: safeDiscount,
    rewardDiscount: safeRewardDiscount,
    totalPayable,
  };
}
