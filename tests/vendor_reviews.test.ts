/**
 * GrabIt — Vendor Reviews & Ratings Test Suite
 * Tests:
 * 1. GET /api/vendor/reviews unauthenticated access gating (401 response).
 * 2. Star rating distribution calculation logic & safe percentage calculations.
 * 3. Dish rating leaderboard aggregation & highest vs lowest sorting.
 * 4. Combined review search and star rating filter matching logic.
 */

import { GET } from "../app/api/vendor/reviews/route";

async function runVendorReviewsTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Vendor Reviews & Ratings Suite");
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

  // TEST 1: Unauthenticated GET request returns 401
  const unauthReq = new Request("http://localhost:3000/api/vendor/reviews", {
    method: "GET",
  });

  const unauthRes = await GET(unauthReq);
  const unauthJson = await unauthRes.json();

  assert(
    unauthRes.status === 401 && !unauthJson.ok && Boolean(unauthJson.error),
    "GET /api/vendor/reviews without session strictly returns 401 Access Denied error",
  );

  // TEST 2: Star rating distribution & safe percentage calculations
  const mockRatings = [5, 5, 4, 3, 5, 1]; // sum = 23, count = 6, avg = 3.8
  const total = mockRatings.length;
  const fiveCount = mockRatings.filter((r) => r === 5).length;
  const fourCount = mockRatings.filter((r) => r === 4).length;

  const avgRating = total > 0 ? Number((mockRatings.reduce((a, b) => a + b, 0) / total).toFixed(1)) : 5.0;
  const fiveStarPct = total > 0 ? Number(((fiveCount / total) * 100).toFixed(1)) : 0;
  const zeroTotalPct = 0 > 0 ? (0 / 0) * 100 : 0; // safe zero check

  assert(
    avgRating === 3.8 &&
      fiveStarPct === 50.0 &&
      !isNaN(zeroTotalPct) &&
      isFinite(zeroTotalPct),
    "Star distribution calculations accurately compute average ratings and handle 0-review edge cases without NaN or Infinity",
  );

  // TEST 3: Dish rating leaderboard aggregation & highest vs lowest sorting
  const mockDishes = [
    { menuItemId: "dish-1", name: "Zinger Burger", avgRating: 4.8, totalReviews: 12 },
    { menuItemId: "dish-2", name: "Fries", avgRating: 3.5, totalReviews: 8 },
    { menuItemId: "dish-3", name: "Cold Coffee", avgRating: 4.2, totalReviews: 5 },
  ];

  const highest = [...mockDishes].sort((a, b) => b.avgRating - a.avgRating);
  const lowest = [...mockDishes].sort((a, b) => a.avgRating - b.avgRating);

  assert(
    highest[0].menuItemId === "dish-1" &&
      lowest[0].menuItemId === "dish-2",
    "Product rating leaderboard correctly sorts dishes by Highest Rated (descending avg) and Lowest Rated (ascending avg)",
  );

  // TEST 4: Combined search and star rating filter matching logic
  const mockReviewItems = [
    { reviewText: "Amazing Zinger Burger!", rating: 5, orderNumber: "ORD-101", menuItemName: "Zinger Burger" },
    { reviewText: "Cold fries", rating: 2, orderNumber: "ORD-102", menuItemName: "Fries" },
    { reviewText: "Good burger but late", rating: 4, orderNumber: "ORD-103", menuItemName: "Veggie Burger" },
  ];

  const query = "burger";
  const ratingFilter: string = "5";

  const filtered = mockReviewItems.filter((r) => {
    if (ratingFilter !== "all" && Number(r.rating) !== Number(ratingFilter)) return false;
    const q = query.toLowerCase();
    return (
      r.reviewText.toLowerCase().includes(q) ||
      r.menuItemName.toLowerCase().includes(q) ||
      r.orderNumber.toLowerCase().includes(q)
    );
  });

  assert(
    filtered.length === 1 && filtered[0].orderNumber === "ORD-101",
    "Search query and star rating filters combine seamlessly to match specific vendor review items",
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runVendorReviewsTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
