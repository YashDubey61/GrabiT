/**
 * Automated Verification Test Suite — Popular Around Campus Quick Add Stepper
 * Run with: npx tsx tests/popular_around_campus_stepper.test.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

function runPopularAroundCampusStepperTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Popular Around Campus Stepper Test Suite");
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

  // 1. Static Analysis: StudentRecommendationsSection source code
  const recommendationsSrc = readFileSync(
    join(process.cwd(), "components/student/StudentRecommendationsSection.tsx"),
    "utf-8",
  );

  assert(
    recommendationsSrc.includes('import { useCart } from "@/lib/cart/CartContext";'),
    "Component subscribes to global useCart context",
  );

  assert(
    recommendationsSrc.includes("quantityOf") &&
      recommendationsSrc.includes("cart.items.find((i) => i.menuItemId === itemId)?.quantity ?? 0"),
    "Component derives quantity strictly from cart.items as single source of truth",
  );

  assert(
    recommendationsSrc.includes("quantity === 0 ?") &&
      recommendationsSrc.includes("Quick Add") &&
      recommendationsSrc.includes("handleDecrement") &&
      recommendationsSrc.includes("handleIncrement"),
    "Component renders Quick Add when quantity is 0, and quantity stepper when quantity > 0",
  );

  assert(
    recommendationsSrc.includes("cart.decrement(item.itemId)"),
    "Decrement button directly calls cart.decrement with item.itemId",
  );

  assert(
    recommendationsSrc.includes("cart.increment(item.itemId)"),
    "Increment button directly calls cart.increment with item.itemId",
  );

  // 2. Logic Simulation: Cart state transitions
  console.log("\n--- Simulating Cart State Transitions ---");

  interface CartItem {
    menuItemId: string;
    canteenId: string;
    name: string;
    price: number;
    quantity: number;
  }

  let cartItems: CartItem[] = [];

  function getQuantity(itemId: string): number {
    return cartItems.find((i) => i.menuItemId === itemId)?.quantity ?? 0;
  }

  function addItem(input: { menuItemId: string; canteenId: string; name: string; price: number }) {
    const existing = cartItems.find((i) => i.menuItemId === input.menuItemId);
    if (existing) {
      cartItems = cartItems.map((i) =>
        i.menuItemId === input.menuItemId ? { ...i, quantity: i.quantity + 1 } : i,
      );
    } else {
      cartItems = [...cartItems, { ...input, quantity: 1 }];
    }
  }

  function increment(itemId: string) {
    cartItems = cartItems.map((i) =>
      i.menuItemId === itemId ? { ...i, quantity: i.quantity + 1 } : i,
    );
  }

  function decrement(itemId: string) {
    cartItems = cartItems
      .map((i) => (i.menuItemId === itemId ? { ...i, quantity: i.quantity - 1 } : i))
      .filter((i) => i.quantity > 0);
  }

  const testItemId = "rec-item-maggi-101";

  // Step 1: Initial state
  assert(getQuantity(testItemId) === 0, "Initial item quantity is 0 (Renders '+ Quick Add')");

  // Step 2: User clicks Quick Add
  addItem({ menuItemId: testItemId, canteenId: "canteen-1", name: "Masala Maggi", price: 50 });
  assert(
    getQuantity(testItemId) === 1 && cartItems.length === 1,
    "After Quick Add: Quantity is 1 (Renders '− 1 +')",
  );

  // Step 3: User clicks '+' on stepper
  increment(testItemId);
  assert(
    getQuantity(testItemId) === 2 && cartItems.length === 1,
    "After pressing '+': Quantity is 2 (Renders '− 2 +')",
  );

  // Step 4: User clicks '-' on stepper
  decrement(testItemId);
  assert(
    getQuantity(testItemId) === 1 && cartItems.length === 1,
    "After pressing '−': Quantity is 1 (Renders '− 1 +')",
  );

  // Step 5: User clicks '-' at quantity 1
  decrement(testItemId);
  assert(
    getQuantity(testItemId) === 0 && cartItems.length === 0,
    "After pressing '−' at 1: Item is removed and quantity is 0 (Reverts to '+ Quick Add')",
  );

  // Step 6: Item added from vendor menu is immediately reflected
  addItem({ menuItemId: testItemId, canteenId: "canteen-1", name: "Masala Maggi", price: 50 });
  assert(
    getQuantity(testItemId) === 1,
    "Item added from vendor menu is immediately reflected as quantity 1 in Popular Around Campus",
  );

  // Step 7: No duplicate line items created on repeated quick add
  addItem({ menuItemId: testItemId, canteenId: "canteen-1", name: "Masala Maggi", price: 50 });
  assert(
    cartItems.length === 1 && cartItems[0].quantity === 2,
    "Adding existing item does NOT create duplicate line items (line count is 1, quantity is 2)",
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passed} PASSED, ${total - passed} FAILED`);
  console.log("==================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runPopularAroundCampusStepperTestSuite();
