/**
 * Shared reward-code → checkout-discount computation, used by both the
 * preview route (UX feedback) and the real order-creation routes
 * (server-authoritative). A redeemed reward code is never a generic
 * percentage/flat coupon — it represents a specific free reward, so
 * the discount is derived from the reward's own definition, never
 * from anything the client sends.
 */

export interface RewardCodeConfig {
  rewardId: string;
  rewardName: string;
  rewardType: "FOOD_ITEM" | "DISCOUNT" | "PERK";
  menuItemId: string | null;
  discountAmount: number | null;
  canteenId: string | null;
}

export interface CartLineForReward {
  menuItemId: string;
  lineTotal: number;
}

export interface RewardDiscountResult {
  ok: boolean;
  discountAmount: number;
  error?: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeRewardCheckoutDiscount(
  reward: RewardCodeConfig,
  cart: { canteenId: string; items: CartLineForReward[]; subtotal: number },
): RewardDiscountResult {
  // A reward tied to a specific vendor can only be applied at that
  // vendor's checkout.
  if (reward.canteenId && reward.canteenId !== cart.canteenId) {
    return { ok: false, discountAmount: 0, error: "CODE_NOT_VALID_FOR_VENDOR" };
  }

  if (reward.rewardType === "FOOD_ITEM" && reward.menuItemId) {
    // Product-tied reward — the required item must actually be in the
    // cart; the free item's own line total is the discount, never the
    // whole order (so unrelated items in the same cart aren't freed).
    const line = cart.items.find((i) => i.menuItemId === reward.menuItemId);
    if (!line) {
      return { ok: false, discountAmount: 0, error: "REQUIRED_ITEM_NOT_IN_CART" };
    }
    return { ok: true, discountAmount: round2(Math.min(line.lineTotal, cart.subtotal)) };
  }

  if (reward.rewardType === "DISCOUNT") {
    // General monetary reward — reuse the reward's own configured
    // discount_amount rather than inventing a new value.
    const amount = reward.discountAmount ?? 0;
    return { ok: true, discountAmount: round2(Math.min(amount, cart.subtotal)) };
  }

  // FOOD_ITEM with no specific menu_item_id linked (the common case
  // today — none of the seeded rewards are linked to a real menu item)
  // has no monetary anchor to reference, so the reward is honored as a
  // fully complimentary order, matching the product's own worked
  // example ("500 pts → Free Sandwich" → order becomes ₹0).
  if (reward.rewardType === "FOOD_ITEM") {
    return { ok: true, discountAmount: round2(cart.subtotal) };
  }

  return { ok: false, discountAmount: 0, error: "CODE_NOT_APPLICABLE_AT_CHECKOUT" };
}

export function isRewardCodeFormat(code: string): boolean {
  return /^\d{16}$/.test(code.trim());
}
