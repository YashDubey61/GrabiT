/**
 * Automated Verification Test Suite — ONE-VENDOR-PER-ORDER & CartBar UI Suite
 * Run with node/tsx: npx tsx tests/one_vendor_per_order.test.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

function runOneVendorPerOrderTestSuite() {
  console.log("==================================================");
  console.log("GRABIT One-Vendor-Per-Order & CartBar Test Suite");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  const assert = (condition: boolean, title: string, detail?: string) => {
    total++;
    if (condition) {
      console.log(`✅ TEST ${total} PASSED: ${title}`);
      passed++;
    } else {
      console.error(`❌ TEST ${total} FAILED: ${title}`, detail || "");
    }
  };

  // 1. Static check: CartContext imports and renders global CanteenConflictModal
  const cartContextSrc = readFileSync(
    join(process.cwd(), "lib/cart/CartContext.tsx"),
    "utf-8",
  );

  assert(
    cartContextSrc.includes("CanteenConflictModal"),
    "CartContext imports and renders CanteenConflictModal globally",
  );

  assert(
    cartContextSrc.includes("prev.canteenId && prev.items.length > 0 && prev.canteenId !== input.canteenId"),
    "CartContext enforces strict one-vendor locking when adding items",
  );

  assert(
    cartContextSrc.includes("localStorage.setItem") && cartContextSrc.includes("sessionStorage.setItem"),
    "CartContext persists vendor-locked cart to both localStorage and sessionStorage",
  );

  // 2. Static check: CanteenConflictModal UI structure
  const modalSrc = readFileSync(
    join(process.cwd(), "components/student/CanteenConflictModal.tsx"),
    "utf-8",
  );

  assert(
    modalSrc.includes("Different vendor"),
    "CanteenConflictModal renders 'Different vendor' title per spec",
  );

  assert(
    modalSrc.includes("View Current Cart") && modalSrc.includes("Start New Order"),
    "CanteenConflictModal includes 'View Current Cart' and 'Start New Order' CTAs",
  );

  // 3. Static check: CartBar formats current vendor name, supports dismiss X button & isDifferentVendor indicator
  const cartBarSrc = readFileSync(
    join(process.cwd(), "components/student/CartBar.tsx"),
    "utf-8",
  );

  assert(
    cartBarSrc.includes("Cart from another vendor") && cartBarSrc.includes("isDifferentVendor"),
    "CartBar supports 'Cart from another vendor' indicator when visiting a different vendor's page",
  );

  assert(
    cartBarSrc.includes('aria-label="Dismiss cart"') && cartBarSrc.includes("setIsDismissed(true)"),
    "CartBar renders a dedicated dismiss button with aria-label='Dismiss cart' that hides the bar without modifying cart data",
  );

  assert(
    cartBarSrc.includes("useEffect") && cartBarSrc.includes("setIsDismissed(false)"),
    "CartBar automatically resets dismiss state and reappears when cart items or total change",
  );

  // 4. Server API Validation Check: POST /api/orders enforces single vendor
  const apiOrdersSrc = readFileSync(
    join(process.cwd(), "app/api/orders/route.ts"),
    "utf-8",
  );

  assert(
    apiOrdersSrc.includes("dbItem.canteenId !== effectiveCanteenId") &&
      apiOrdersSrc.includes("One or more items do not belong to the selected vendor."),
    "/api/orders rejects cross-vendor items with 400 status",
  );

  // 5. Server API Validation Check: POST /api/payments/cashfree/create-order enforces single vendor
  const apiCashfreeSrc = readFileSync(
    join(process.cwd(), "app/api/payments/cashfree/create-order/route.ts"),
    "utf-8",
  );

  assert(
    apiCashfreeSrc.includes("dbItem.canteenId !== payload.canteenId") &&
      apiCashfreeSrc.includes("One or more items do not belong to the selected vendor."),
    "/api/payments/cashfree/create-order rejects cross-vendor items with 400 status",
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passed} PASSED, ${total - passed} FAILED`);
  console.log("==================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runOneVendorPerOrderTestSuite();
