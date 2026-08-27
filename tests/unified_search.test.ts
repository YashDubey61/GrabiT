/**
 * Automated Verification Test Suite — GRABIT Unified Search (Food Items + Stall Names)
 * Run with: npx tsx tests/unified_search.test.ts
 */

import {
  performUnifiedSearch,
  normalizeQuery,
  expandQueryTokens,
} from "@/lib/search/unifiedSearch";
import type { CampusFoodItem } from "@/lib/supabase/data";
import type { MockCanteen } from "@/lib/mock/campus";

const mockFoodItems: CampusFoodItem[] = [
  {
    id: "item-1",
    name: "Masala Maggi",
    price: 50,
    description: "Hot Maggi noodles prepared with vegetables and Indian spices.",
    category: "Meal / Snacks",
    imageUrl: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841",
    isVeg: true,
    available: true,
    canteenId: "canteen-1",
    canteenName: "BURGER KING",
  },
  {
    id: "item-2",
    name: "Cold Coffee",
    price: 70,
    description: "Chilled creamy cold coffee.",
    category: "Beverages",
    imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c",
    isVeg: true,
    available: true,
    canteenId: "canteen-1",
    canteenName: "BURGER KING",
  },
  {
    id: "item-3",
    name: "Veg Sandwich",
    price: 60,
    description: "Fresh vegetable sandwich with delicious seasoning.",
    category: "Quick Snacks",
    imageUrl: "https://images.unsplash.com/photo-1553909489-cd47e0ef937f",
    isVeg: true,
    available: true,
    canteenId: "canteen-1",
    canteenName: "BURGER KING",
  },
  {
    id: "item-4",
    name: "Aloo Samosa",
    price: 20,
    description: "Crispy potato-filled samosa served hot.",
    category: "Quick Snacks",
    imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
    isVeg: true,
    available: true,
    canteenId: "canteen-1",
    canteenName: "BURGER KING",
  },
  {
    id: "item-5",
    name: "CHAI",
    price: 30,
    description: "Hot spiced kadak milk tea.",
    category: "Beverages",
    imageUrl: "",
    isVeg: true,
    available: true,
    canteenId: "canteen-2",
    canteenName: "STARBUCK",
  },
  {
    id: "item-6",
    name: "Classic Veg Burger",
    price: 80,
    description: "Crispy veggie patty with lettuce, tomatoes and special sauce.",
    category: "Quick Snacks",
    imageUrl: "",
    isVeg: true,
    available: true,
    canteenId: "canteen-1",
    canteenName: "BURGER KING",
  },
  {
    id: "item-7",
    name: "Paneer Pizza",
    price: 150,
    description: "Cheesy pizza topped with marinated paneer cubes and herbs.",
    category: "Meals",
    imageUrl: "",
    isVeg: true,
    available: true,
    canteenId: "canteen-2",
    canteenName: "STARBUCK",
  },
];

const mockCanteens: MockCanteen[] = [
  {
    id: "canteen-1",
    name: "BURGER KING",
    cuisineTags: "Snacks • Beverages • Meals",
    category: "quick_snacks",
    waitMinutes: 8,
    rating: 4.8,
    ratingNote: "Live",
    trending: true,
    image: "",
    imageAlt: "Burger King",
    images: [],
  },
  {
    id: "canteen-2",
    name: "STARBUCK",
    cuisineTags: "Fast Food & Snacks • Beverages",
    category: "beverages",
    waitMinutes: 12,
    rating: 4.6,
    ratingNote: "Live",
    trending: false,
    image: "",
    imageAlt: "Starbuck",
    images: [],
  },
];

function runUnifiedSearchTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Unified Search Test Suite");
  console.log("==================================================\n");

  let total = 0;
  let passed = 0;

  const assert = (condition: boolean, title: string, detail?: any) => {
    total++;
    if (condition) {
      console.log(`✅ TEST ${total} PASSED: ${title}`);
      passed++;
    } else {
      console.error(`❌ TEST ${total} FAILED: ${title}`, detail || "");
    }
  };

  // 1. Exact Match: "Masala Maggi"
  const resExact = performUnifiedSearch("Masala Maggi", mockFoodItems, mockCanteens);
  assert(
    resExact.foodItems.length > 0 && resExact.foodItems[0].name === "Masala Maggi",
    'Exact search "Masala Maggi" surfaces Masala Maggi as first food result',
  );

  // 2. Partial / Stem: "Maggi"
  const resMaggi = performUnifiedSearch("Maggi", mockFoodItems, mockCanteens);
  assert(
    resMaggi.foodItems.some((f) => f.name === "Masala Maggi"),
    'Search "Maggi" finds "Masala Maggi"',
  );

  // 3. Spelling Variation: "Maggie"
  const resMaggie = performUnifiedSearch("Maggie", mockFoodItems, mockCanteens);
  assert(
    resMaggie.foodItems.some((f) => f.name === "Masala Maggi"),
    'Spelling variation "Maggie" finds "Masala Maggi"',
  );

  // 4. Short Prefix: "magg"
  const resMagg = performUnifiedSearch("magg", mockFoodItems, mockCanteens);
  assert(
    resMagg.foodItems.some((f) => f.name === "Masala Maggi"),
    'Prefix "magg" finds "Masala Maggi"',
  );

  // 5. Stall Match: "Burger King"
  const resStall = performUnifiedSearch("Burger King", mockFoodItems, mockCanteens);
  assert(
    resStall.canteens.length > 0 && resStall.canteens[0].canteen.name === "BURGER KING",
    'Search "Burger King" returns BURGER KING stall as top stall',
  );
  assert(
    resStall.canteens[0].matchingFoodItems.length > 0,
    'Search "Burger King" includes dishes available at BURGER KING',
  );

  // 6. Food item + Stall cross-dimension: "Burger"
  const resBurger = performUnifiedSearch("Burger", mockFoodItems, mockCanteens);
  assert(
    resBurger.foodItems.some((f) => f.name.includes("Burger")),
    'Search "Burger" returns burger dishes',
  );
  assert(
    resBurger.canteens.some((c) => c.canteen.name === "BURGER KING"),
    'Search "Burger" also returns BURGER KING stall',
  );

  // 7. Beverage search: "Cold Coffee" & "Coffee"
  const resColdCoffee = performUnifiedSearch("Cold Coffee", mockFoodItems, mockCanteens);
  const resCoffee = performUnifiedSearch("Coffee", mockFoodItems, mockCanteens);
  assert(
    resColdCoffee.foodItems.some((f) => f.name === "Cold Coffee"),
    'Search "Cold Coffee" finds "Cold Coffee"',
  );
  assert(
    resCoffee.foodItems.some((f) => f.name === "Cold Coffee"),
    'Search "Coffee" finds "Cold Coffee"',
  );

  // 8. Chai & Tea synonym: "Chai" & "Tea"
  const resChai = performUnifiedSearch("Chai", mockFoodItems, mockCanteens);
  const resTea = performUnifiedSearch("Tea", mockFoodItems, mockCanteens);
  assert(
    resChai.foodItems.some((f) => f.name === "CHAI"),
    'Search "Chai" finds "CHAI"',
  );
  assert(
    resTea.foodItems.some((f) => f.name === "CHAI"),
    'Search "Tea" (synonym) finds "CHAI"',
  );

  // 9. Pizza search: "Pizza" & "pizzas"
  const resPizza = performUnifiedSearch("Pizza", mockFoodItems, mockCanteens);
  const resPizzas = performUnifiedSearch("pizzas", mockFoodItems, mockCanteens);
  assert(
    resPizza.foodItems.some((f) => f.name === "Paneer Pizza"),
    'Search "Pizza" finds "Paneer Pizza"',
  );
  assert(
    resPizzas.foodItems.some((f) => f.name === "Paneer Pizza"),
    'Search "pizzas" finds "Paneer Pizza"',
  );

  // 10. Category search: "Quick Snacks"
  const resCategory = performUnifiedSearch("Quick Snacks", mockFoodItems, mockCanteens);
  assert(
    resCategory.foodItems.some((f) => f.category === "Quick Snacks"),
    'Search "Quick Snacks" finds dishes in the Quick Snacks category',
  );

  // 11. Casing & Whitespace tolerance: "   mASaLA mAGgi   "
  const resCasing = performUnifiedSearch("   mASaLA mAGgi   ", mockFoodItems, mockCanteens);
  assert(
    resCasing.foodItems.length > 0 && resCasing.foodItems[0].name === "Masala Maggi",
    'Case-insensitive and whitespace-tolerant search correctly matches "Masala Maggi"',
  );

  // 12. Ranking priority: Exact name match ranks above description match
  const resRanking = performUnifiedSearch("Veg Sandwich", mockFoodItems, mockCanteens);
  assert(
    resRanking.foodItems[0].name === "Veg Sandwich",
    "Exact food item match is ranked #1 over partial / description matches",
  );

  // 13. Non-existent query: "xyznonexistent123"
  const resNone = performUnifiedSearch("xyznonexistent123", mockFoodItems, mockCanteens);
  assert(
    resNone.foodItems.length === 0 && resNone.canteens.length === 0 && !resNone.hasResults,
    "Non-existent query returns hasResults: false with 0 matches",
  );

  // 14. Empty query: ""
  const resEmpty = performUnifiedSearch("", mockFoodItems, mockCanteens);
  assert(
    resEmpty.foodItems.length === 0 && !resEmpty.hasResults,
    "Empty query returns hasResults: false without throwing",
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passed} PASSED, ${total - passed} FAILED`);
  console.log("==================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runUnifiedSearchTestSuite();
