/**
 * GrabIt — Reward Redemption Codes at Checkout Test Suite
 *
 * Covers the shared computeRewardCheckoutDiscount() logic plus
 * structural checks that server-side atomicity/ownership are wired
 * correctly. The atomic single-use enforcement and ownership check
 * (redeem_reward → 16-digit code → preview_reward_code →
 * consume_reward_code) were verified live via direct SQL — see the
 * session's final report: another student's user_id was correctly
 * rejected with NOT_YOUR_CODE, and a second order attempting to
 * consume an already-USED code was correctly rejected with
 * CODE_ALREADY_USED.
 */

import { computeRewardCheckoutDiscount, isRewardCodeFormat } from "../lib/rewards/checkout";

async function runRewardCodeCheckoutTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Reward Redemption Codes at Checkout Test Suite");
  console.log("==================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition: boolean, testName: string, detail?: string) => {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ TEST ${totalTests} PASSED: ${testName}`);
    } else {
      console.error(`❌ TEST ${totalTests} FAILED: ${testName}`, detail || "");
    }
  };

  // --- 16-digit code format detection ---
  assert(isRewardCodeFormat("4837192056418273"), "16-digit numeric string is recognized as a reward code");
  assert(!isRewardCodeFormat("WELCOME50"), "Alphanumeric promo code is NOT treated as a reward code");
  assert(!isRewardCodeFormat("123456789012345"), "15 digits is not a valid reward code (too short)");
  assert(!isRewardCodeFormat("12345678901234567"), "17 digits is not a valid reward code (too long)");

  // --- FOOD_ITEM tied to a specific menu item: only that item's line total is freed ---
  const tiedResult = computeRewardCheckoutDiscount(
    { rewardId: "r1", rewardName: "Free Sandwich", rewardType: "FOOD_ITEM", menuItemId: "sandwich-1", discountAmount: null, canteenId: null },
    { canteenId: "c1", items: [{ menuItemId: "sandwich-1", lineTotal: 70 }, { menuItemId: "drink-1", lineTotal: 30 }], subtotal: 100 },
  );
  assert(tiedResult.ok && tiedResult.discountAmount === 70, "Product-tied reward only discounts its own line total (₹70), not the whole ₹100 cart", String(tiedResult.discountAmount));

  // --- FOOD_ITEM tied to a menu item NOT in the cart is rejected ---
  const missingItemResult = computeRewardCheckoutDiscount(
    { rewardId: "r1", rewardName: "Free Sandwich", rewardType: "FOOD_ITEM", menuItemId: "sandwich-1", discountAmount: null, canteenId: null },
    { canteenId: "c1", items: [{ menuItemId: "drink-1", lineTotal: 30 }], subtotal: 30 },
  );
  assert(!missingItemResult.ok && missingItemResult.error === "REQUIRED_ITEM_NOT_IN_CART", "Reward tied to a product not in the cart is rejected");

  // --- DISCOUNT type reuses the reward's own configured discount_amount ---
  const discountTypeResult = computeRewardCheckoutDiscount(
    { rewardId: "r2", rewardName: "₹100 OFF", rewardType: "DISCOUNT", menuItemId: null, discountAmount: 100, canteenId: null },
    { canteenId: "c1", items: [{ menuItemId: "x", lineTotal: 200 }], subtotal: 200 },
  );
  assert(discountTypeResult.ok && discountTypeResult.discountAmount === 100, "DISCOUNT-type reward applies its configured amount (₹100)");

  const discountCappedResult = computeRewardCheckoutDiscount(
    { rewardId: "r2", rewardName: "₹100 OFF", rewardType: "DISCOUNT", menuItemId: null, discountAmount: 100, canteenId: null },
    { canteenId: "c1", items: [{ menuItemId: "x", lineTotal: 40 }], subtotal: 40 },
  );
  assert(discountCappedResult.discountAmount === 40, "DISCOUNT-type reward is capped at the subtotal, never exceeds the eligible order amount");

  // --- FOOD_ITEM with no linked menu item (today's real seeded rewards) → full order free, matching the spec's example ---
  const untiedResult = computeRewardCheckoutDiscount(
    { rewardId: "r3", rewardName: "Free Cold Coffee", rewardType: "FOOD_ITEM", menuItemId: null, discountAmount: null, canteenId: null },
    { canteenId: "c1", items: [{ menuItemId: "y", lineTotal: 70 }], subtotal: 70 },
  );
  assert(untiedResult.ok && untiedResult.discountAmount === 70, "Spec worked example: Subtotal ₹70 → Reward Discount ₹70 → Total ₹0", String(untiedResult.discountAmount));

  // --- PERK rewards aren't checkout-applicable ---
  const perkResult = computeRewardCheckoutDiscount(
    { rewardId: "r4", rewardName: "Free Delivery", rewardType: "PERK", menuItemId: null, discountAmount: null, canteenId: null },
    { canteenId: "c1", items: [{ menuItemId: "x", lineTotal: 50 }], subtotal: 50 },
  );
  assert(!perkResult.ok && perkResult.error === "CODE_NOT_APPLICABLE_AT_CHECKOUT", "PERK-type rewards are rejected at checkout (no monetary benefit modeled)");

  // --- Vendor-restricted reward rejected at a different vendor's checkout ---
  const wrongVendorResult = computeRewardCheckoutDiscount(
    { rewardId: "r5", rewardName: "Free Item", rewardType: "FOOD_ITEM", menuItemId: null, discountAmount: null, canteenId: "vendor-A" },
    { canteenId: "vendor-B", items: [{ menuItemId: "x", lineTotal: 50 }], subtotal: 50 },
  );
  assert(!wrongVendorResult.ok && wrongVendorResult.error === "CODE_NOT_VALID_FOR_VENDOR", "Vendor-restricted reward rejected when checking out at a different vendor");

  // --- Structural: server never trusts a client-supplied reward discount ---
  const ordersRouteSource = await (await import("node:fs/promises")).readFile(
    new URL("../app/api/orders/route.ts", import.meta.url),
    "utf-8",
  );
  assert(ordersRouteSource.includes("consume_reward_code"), "/api/orders consumes reward codes via the atomic consume_reward_code RPC");
  assert(
    ordersRouteSource.includes("Only one promo or reward code can be applied"),
    "Stacking a promo code with a reward code in the same order is rejected (prefer one, not both)",
  );
  assert(
    /paymentMethod === "wallet" && totalAmount > 0/.test(ordersRouteSource),
    "Wallet debit is skipped entirely for a ₹0 reward/promo-covered order — nothing charged",
  );

  const cashfreeRouteSource = await (await import("node:fs/promises")).readFile(
    new URL("../app/api/payments/cashfree/create-order/route.ts", import.meta.url),
    "utf-8",
  );
  assert(cashfreeRouteSource.includes("consume_reward_code"), "Cashfree route also consumes reward codes server-side before computing the payable amount");
  assert(
    cashfreeRouteSource.includes("skippedPayment") && /totalAmount\s*<=\s*0/.test(cashfreeRouteSource),
    "Cashfree route skips the payment gateway entirely when the reward/promo discount brings the total to ₹0",
  );

  const previewRouteSource = await (await import("node:fs/promises")).readFile(
    new URL("../app/api/promo-codes/preview/route.ts", import.meta.url),
    "utf-8",
  );
  assert(previewRouteSource.includes("isRewardCodeFormat"), "Preview route routes 16-digit codes to reward-code validation, others to promo-code validation");

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runRewardCodeCheckoutTestSuite().catch((err) => {
  console.error("Test execution threw uncaught error:", err);
  process.exit(1);
});
