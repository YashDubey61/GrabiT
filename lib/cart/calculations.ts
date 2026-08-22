import type { CartItem } from "@/lib/cart/types";
import { calculateOrderPricing } from "@/lib/pricing/order_pricing";

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
 * Platform fee display helper — thin wrapper around the single
 * authoritative pricing calculation (lib/pricing/order_pricing.ts) so
 * Checkout shows the exact same fee the server will charge: ₹2.50 when
 * subtotal > ₹25, otherwise ₹0. GRABIT does not charge delivery.
 */
export function getPlatformFee(subtotal: number): number {
  return calculateOrderPricing(subtotal).platformFee;
}
