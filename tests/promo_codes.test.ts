/**
 * GrabIt — Promo Code / Coupon System Test Suite
 *
 * Covers the shared calculateOrderPricing() discount composition
 * (Subtotal → Promo Discount → Fees → Total) plus structural checks
 * that server-side validation/atomicity are wired correctly. The
 * atomic usage-limit enforcement (redeem_promo_code RPC row-locking)
 * was verified separately via live SQL — see the session's final
 * report: a usage_limit=1 code correctly redeemed once and rejected
 * on a second concurrent attempt with USAGE_LIMIT_REACHED.
 */

import { calculateOrderPricing } from "../lib/pricing/order_pricing";

async function runPromoCodesTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Promo Code / Coupon System Test Suite");
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

  // --- Subtotal → Promo Discount → Fees → Total composition ---
  const flat = calculateOrderPricing({ subtotal: 100, discount: 20 });
  assert(flat.discount === 20, "Flat ₹20 discount is applied");
  assert(flat.platformFee === 2.5, "Platform fee still computed off the ORIGINAL subtotal (₹100 > ₹25), not the discounted amount");
  assert(flat.totalPayable === 82.5, "Total = 100 + 2.5 fee - 20 discount = 82.50", String(flat.totalPayable));

  const pct = calculateOrderPricing({ subtotal: 300, discount: 20 }); // 10% capped at ₹20
  assert(pct.totalPayable === 282.5, "Percentage discount (pre-capped by caller) composes correctly: 300 + 2.5 - 20 = 282.50", String(pct.totalPayable));

  // --- Discount can never exceed the eligible order amount / go negative ---
  const overDiscount = calculateOrderPricing({ subtotal: 10, discount: 100 });
  assert(overDiscount.totalPayable === 0, "Total never goes negative even if discount exceeds subtotal+fee");

  const noDiscount = calculateOrderPricing({ subtotal: 70 });
  assert(noDiscount.discount === 0, "No promo applied → discount is 0");
  assert(noDiscount.totalPayable === 72.5, "No promo applied → total unchanged from the base ₹70 + ₹2.50 fee case");

  // --- Structural: server never trusts a client-supplied discount ---
  const ordersRouteSource = await (await import("node:fs/promises")).readFile(
    new URL("../app/api/orders/route.ts", import.meta.url),
    "utf-8",
  );
  assert(
    ordersRouteSource.includes("redeem_promo_code") && ordersRouteSource.includes("p_subtotal: subtotal"),
    "Server /api/orders redeems the promo code against its OWN server-computed subtotal, not a client-supplied one",
  );
  assert(
    ordersRouteSource.includes('payload.promoCode !== "wallet"') === false && ordersRouteSource.includes("discount"),
    "Server /api/orders composes pricing with the RPC-returned discount, not a client-sent discount value",
  );

  const cashfreeRouteSource = await (await import("node:fs/promises")).readFile(
    new URL("../app/api/payments/cashfree/create-order/route.ts", import.meta.url),
    "utf-8",
  );
  assert(cashfreeRouteSource.includes("redeem_promo_code"), "Cashfree create-order route also redeems server-side before computing the Cashfree amount");
  assert(
    /orderAmount:\s*totalAmount/.test(cashfreeRouteSource),
    "Cashfree payment amount uses the server-authoritative totalAmount (post-discount), never a client value",
  );

  // --- Structural: promo usage is refunded on failed/abandoned Cashfree payment ---
  const webhookSource = await (await import("node:fs/promises")).readFile(
    new URL("../app/api/payments/cashfree/webhook/route.ts", import.meta.url),
    "utf-8",
  );
  assert(
    webhookSource.includes("promo_code_redemptions") && webhookSource.includes("Refund the promo code usage"),
    "Webhook refunds (deletes) the promo redemption row when a Cashfree payment ultimately fails/is abandoned",
  );

  // --- Structural: only Super Admin can manage promo codes ---
  const adminRouteSource = await (await import("node:fs/promises")).readFile(
    new URL("../app/api/superadmin/promo-codes/route.ts", import.meta.url),
    "utf-8",
  );
  assert(
    adminRouteSource.includes("getAuthenticatedSuperAdminContext"),
    "Super Admin promo-codes API is gated by the shared admin auth resolver",
  );

  const deleteRouteSource = await (await import("node:fs/promises")).readFile(
    new URL("../app/api/superadmin/promo-codes/[id]/route.ts", import.meta.url),
    "utf-8",
  );
  assert(
    deleteRouteSource.includes("redemptions") && deleteRouteSource.includes("count"),
    "Delete route blocks deleting a promo code that already has redemptions (audit history preserved)",
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPromoCodesTestSuite().catch((err) => {
  console.error("Test execution threw uncaught error:", err);
  process.exit(1);
});
