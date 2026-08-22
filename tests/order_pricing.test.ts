/**
 * GrabIt — Checkout Pricing & Payment Method Test Suite
 *
 * Covers the single authoritative calculateOrderPricing() function and
 * confirms it is what both server order-creation routes and the client
 * checkout UI actually use (no duplicate ₹5 mock fee, no stray 5%
 * formula, no delivery charge), plus that UPI is no longer a
 * selectable standalone GRABIT payment method.
 */

import { calculateOrderPricing } from "../lib/pricing/order_pricing";

async function runOrderPricingTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Checkout Pricing & Payment Method Test Suite");
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

  // --- Case 1: ₹20 order ---
  const c1 = calculateOrderPricing(20);
  assert(c1.platformFee === 0, "Case 1 (₹20): Platform Fee is ₹0", String(c1.platformFee));
  assert(c1.deliveryCharge === 0, "Case 1 (₹20): Delivery Charge is ₹0");
  assert(c1.totalPayable === 20, "Case 1 (₹20): Total is ₹20", String(c1.totalPayable));

  // --- Case 2: ₹25 order (boundary — must NOT charge fee) ---
  const c2 = calculateOrderPricing(25);
  assert(c2.platformFee === 0, "Case 2 (₹25 boundary): Platform Fee is ₹0", String(c2.platformFee));
  assert(c2.totalPayable === 25, "Case 2 (₹25 boundary): Total is ₹25", String(c2.totalPayable));

  // --- Boundary just above ₹25 ---
  const c2b = calculateOrderPricing(25.01);
  assert(c2b.platformFee === 2.5, "Boundary (₹25.01): Platform Fee is ₹2.50", String(c2b.platformFee));

  // --- Case 3: ₹70 order (the screenshot example) ---
  const c3 = calculateOrderPricing(70);
  assert(c3.platformFee === 2.5, "Case 3 (₹70): Platform Fee is ₹2.50", String(c3.platformFee));
  assert(c3.deliveryCharge === 0, "Case 3 (₹70): Delivery Charge is ₹0");
  assert(c3.totalPayable === 72.5, "Case 3 (₹70): Total is ₹72.50 (not the old ₹77.50)", String(c3.totalPayable));

  // --- Case 4: ₹100 order ---
  const c4 = calculateOrderPricing(100);
  assert(c4.platformFee === 2.5, "Case 4 (₹100): Platform Fee is ₹2.50");
  assert(c4.totalPayable === 102.5, "Case 4 (₹100): Total is ₹102.50", String(c4.totalPayable));

  // --- Additional table from the spec ---
  assert(calculateOrderPricing(10).platformFee === 0, "₹10 → Platform Fee ₹0");
  assert(calculateOrderPricing(50).platformFee === 2.5, "₹50 → Platform Fee ₹2.50");
  assert(calculateOrderPricing(500).platformFee === 2.5, "₹500 → Platform Fee ₹2.50 (flat, not a %)");

  // --- Decimal handling ---
  const decimalCase = calculateOrderPricing(72.5);
  assert(decimalCase.totalPayable === 75, "Decimal subtotal (₹72.50) handled correctly: total ₹75.00", String(decimalCase.totalPayable));

  // --- Discount / reward deduction composition ---
  const withDiscount = calculateOrderPricing({ subtotal: 70, discount: 5, rewardDiscount: 2.5 });
  assert(withDiscount.totalPayable === 65, "Discounts/rewards subtract from total: ₹70 + ₹2.50 fee − ₹5 − ₹2.50 = ₹65", String(withDiscount.totalPayable));

  // --- Never goes negative ---
  const overDiscounted = calculateOrderPricing({ subtotal: 10, discount: 100 });
  assert(overDiscounted.totalPayable === 0, "Total never goes negative even with an oversized discount");

  // --- No duplicate fee: platformFee is a single flat value, never subtotal-scaled ---
  assert(
    calculateOrderPricing(1000).platformFee === 2.5,
    "No % scaling at high subtotals — flat ₹2.50, confirming the old 5%/₹5 mock formulas are gone",
  );

  // --- UPI is not a selectable standalone payment method ---
  const selectorSource = await (await import("node:fs/promises")).readFile(
    new URL("../components/student/PaymentMethodSelector.tsx", import.meta.url),
    "utf-8",
  );
  const hasUpiOption = /id:\s*"upi"/.test(selectorSource);
  assert(!hasUpiOption, "Payment Methods: no standalone 'upi' option object in PaymentMethodSelector");
  assert(selectorSource.includes('"wallet" | "card"'), "Payment Methods: PaymentMethod type is exactly wallet | card");
  assert(selectorSource.includes("GrabIt Wallet") && selectorSource.includes("Pay Online"), "Payment Methods: exactly GrabIt Wallet + Pay Online are present");

  // --- Server order route rejects non-wallet payment methods ---
  const ordersRouteSource = await (await import("node:fs/promises")).readFile(
    new URL("../app/api/orders/route.ts", import.meta.url),
    "utf-8",
  );
  assert(
    ordersRouteSource.includes('paymentMethod: "wallet"') && !ordersRouteSource.includes('"upi" | "wallet"'),
    "Server: /api/orders payload type no longer accepts 'upi'",
  );
  assert(!ordersRouteSource.includes("Math.round(subtotal * 0.05)"), "Server: old 5% platform fee formula removed from /api/orders");

  const cashfreeRouteSource = await (await import("node:fs/promises")).readFile(
    new URL("../app/api/payments/cashfree/create-order/route.ts", import.meta.url),
    "utf-8",
  );
  assert(!cashfreeRouteSource.includes("Math.round(subtotal * 0.05)"), "Server: old 5% platform fee formula removed from Cashfree create-order route");
  assert(cashfreeRouteSource.includes("calculateOrderPricing"), "Server: Cashfree create-order route uses the shared authoritative pricing function");

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runOrderPricingTestSuite().catch((err) => {
  console.error("Test execution threw uncaught error:", err);
  process.exit(1);
});
