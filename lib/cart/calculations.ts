import type { CartItem } from "@/lib/cart/types";

/**
 * Single source of truth for cart math. CartContext calls these to derive
 * `itemCount`/`subtotal`; Checkout and the Menu CartBar both read those
 * derived values from the context rather than recomputing — nothing
 * outside this file multiplies a price by a quantity.
 */

export function calculateItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * The approved Checkout export shows a flat "Platform Fee ₹5" line
 * regardless of order size. Display-only mock value — explicitly NOT the
 * PRD §8 platform-fee formula (free ≤₹30, flat ₹3.50 split above that).
 * Moved here on Day 4 (from CheckoutBillDetails) so order creation uses
 * the exact same number Checkout displayed — one fee calculation, not
 * a second copy computed at order-creation time.
 */
const MOCK_PLATFORM_FEE = 5;

export function getMockPlatformFee(subtotal: number): number {
  return subtotal > 0 ? MOCK_PLATFORM_FEE : 0;
}
