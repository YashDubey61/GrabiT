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
