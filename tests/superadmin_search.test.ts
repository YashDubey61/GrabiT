/**
 * GrabIt — Super Admin Global Search & Unified Operations Finder Security & Functionality Suite
 * Tests:
 * 1. Role Authorization Gating for /superadmin/search.
 * 2. Multi-Domain Entity Querying & Relevance Ranking.
 * 3. Entity Category Filtering.
 * 4. Sensitive Information Protection & Masking.
 * 5. Deep-Link URL Integrity.
 */

import { isAuthorizedForPath } from "../lib/auth/roles";
import { executeGlobalSearch } from "../lib/supabase/superadmin_search";

async function runSuperAdminSearchTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Super Admin Global Search & Finder Suite");
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

  // TEST 1: Role Authorization Gating
  const isAdminAllowed = isAuthorizedForPath("admin", "/superadmin/search");
  const isVendorAllowed = isAuthorizedForPath("vendor", "/superadmin/search");
  const isStudentAllowed = isAuthorizedForPath("student", "/superadmin/search");

  assert(
    isAdminAllowed && !isVendorAllowed && !isStudentAllowed,
    "Super Admin path (/superadmin/search) permits Admin role and strictly blocks Vendor & Student roles"
  );

  // TEST 2: Multi-Domain Entity Querying & Substring Matching
  const orderResults = await executeGlobalSearch({ query: "ORD-8812", category: "ALL" });
  assert(
    Array.isArray(orderResults) && orderResults.length > 0 && orderResults[0].category === "ORDERS",
    "executeGlobalSearch queries across entities and matches specific order numbers"
  );

  // TEST 3: Feature Flag Search
  const flagResults = await executeGlobalSearch({ query: "student_rewards", category: "FEATURE_FLAGS" });
  assert(
    Array.isArray(flagResults) && flagResults.length > 0 && flagResults[0].category === "FEATURE_FLAGS",
    "executeGlobalSearch correctly locates feature flag entities"
  );

  // TEST 4: Category Filtering
  const campusResults = await executeGlobalSearch({ query: "PSIT", category: "CAMPUSES" });
  const allCategoryMatch = campusResults.every((r) => r.category === "CAMPUSES");
  assert(
    campusResults.length > 0 && allCategoryMatch,
    "Category parameter strictly filters search output to the target domain entity"
  );

  // TEST 5: Relevance Ranking Strategy
  const exactSearch = await executeGlobalSearch({ query: "tck_1001", category: "ALL" });
  const topScore = exactSearch[0]?.relevanceScore || 0;
  assert(
    topScore >= 80,
    "Search ranking algorithm prioritizes exact identifier and key matches with top relevance scores"
  );

  // TEST 6: Sensitive Data Protection & Deep Link Integrity
  const userResults = await executeGlobalSearch({ query: "Aarav", category: "USERS" });
  const hasPlainPassword = JSON.stringify(userResults).includes("password");
  const hasValidDeepLinks = userResults.every((r) => Boolean(r.deepLink) && r.deepLink.startsWith("/superadmin/"));

  assert(
    !hasPlainPassword && hasValidDeepLinks,
    "Search result payloads strictly exclude sensitive credentials and generate accurate deep-link URLs"
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSuperAdminSearchTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
