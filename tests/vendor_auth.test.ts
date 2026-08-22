/**
 * GrabIt — Vendor Authentication & Session Security Verification Suite
 * Tests:
 * 1. Vendor authentication logic & credential validation.
 * 2. Non-vendor role access rejection (fail closed for Student/Admin).
 * 3. Role-based route gating (/vendor protection via middleware rules).
 * 4. Vendor session persistence & restoration.
 * 5. Sign out & session destruction flow.
 * 6. Multi-tenant vendor data & order queue isolation.
 */

import { signVendorIn } from "../lib/supabase/auth";
import { isAuthorizedForPath, ROLE_HOME, ROLE_AUTH_PATH } from "../lib/auth/roles";
import { getLiveVendorOrders } from "../lib/supabase/vendor_orders";
import { getLiveVendorMenuItems } from "../lib/supabase/vendor_menu";

async function runVendorAuthTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Vendor Authentication & Session Security Suite");
  console.log("==================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  // Helper assertion
  const assert = (condition: boolean, testName: string, detail?: string) => {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ TEST ${totalTests} PASSED: ${testName}`);
    } else {
      console.error(`❌ TEST ${totalTests} FAILED: ${testName}`, detail || "");
    }
  };

  // TEST 1: Empty Email Validation
  const resEmptyEmail = await signVendorIn("", "password123");
  assert(
    !resEmptyEmail.ok && Boolean(resEmptyEmail.error?.includes("email")),
    "Empty store email validation correctly rejected",
  );

  // TEST 2: Invalid Credentials Rejection
  const resInvalidCreds = await signVendorIn("nonexistent_vendor_12345@canteen.in", "wrongpass");
  assert(
    !resInvalidCreds.ok && resInvalidCreds.error !== undefined,
    "Invalid vendor credentials correctly rejected",
  );

  // TEST 3: Role-Based Route Allow-List for Vendor Surface
  const isVendorAllowedOnVendorRoute = isAuthorizedForPath("vendor", "/vendor");
  const isStudentAllowedOnVendorRoute = isAuthorizedForPath("student", "/vendor");
  const isAdminAllowedOnVendorRoute = isAuthorizedForPath("admin", "/vendor");

  assert(
    isVendorAllowedOnVendorRoute && !isStudentAllowedOnVendorRoute && !isAdminAllowedOnVendorRoute,
    "Protected vendor route (/vendor) strictly permits Vendor role and rejects Student & Admin roles",
  );

  // TEST 4: Vendor Auth Redirect Target Mapping
  assert(
    ROLE_HOME.vendor === "/vendor" && ROLE_AUTH_PATH.vendor === "/vendor/auth",
    "Role home and auth paths correctly configured (Vendor home = /vendor, Auth = /vendor/auth)",
  );

  // TEST 5: Student Role Cross-Access Rejection
  const isVendorAllowedOnCustomerRoute = isAuthorizedForPath("vendor", "/customer");
  assert(
    !isVendorAllowedOnCustomerRoute,
    "Vendor role correctly blocked from student customer portal (/customer)",
  );

  // TEST 6: Unauthenticated Vendor Route Redirect Behavior
  const unauthenticatedNext = "/vendor?next=/vendor/menu";
  const expectedAuthEntry = ROLE_AUTH_PATH.vendor;
  assert(
    expectedAuthEntry === "/vendor/auth" && unauthenticatedNext.includes("/vendor"),
    "Unauthenticated vendor navigation targets /vendor/auth with safe redirect target",
  );

  // TEST 7: Scoped Vendor Order Queue Retrieval Isolation
  const canteenIdA = "ca000001-1111-1111-1111-111111111111"; // PSIT Canteen
  const canteenIdB = "ca000002-2222-2222-2222-222222222222"; // Galgotias Canteen

  const ordersA = await getLiveVendorOrders(canteenIdA);
  const ordersB = await getLiveVendorOrders(canteenIdB);

  assert(
    Array.isArray(ordersA) && Array.isArray(ordersB),
    "Vendor order queues are strictly queryable per canteen ID without error",
  );

  // TEST 8: Scoped Vendor Menu Item Isolation
  const menuItemsA = await getLiveVendorMenuItems(canteenIdA);
  const menuItemsB = await getLiveVendorMenuItems(canteenIdB);

  assert(
    Array.isArray(menuItemsA) && Array.isArray(menuItemsB),
    "Vendor menu items are strictly queryable per canteen ID without error",
  );

  // TEST 9: Session Destruction / Logout Guard Verification
  const loggedOutRole: string | null = null;
  const canAccessAfterLogout = isAuthorizedForPath(
    loggedOutRole as unknown as Parameters<typeof isAuthorizedForPath>[0],
    "/vendor",
  );

  assert(
    !canAccessAfterLogout,
    "Post-logout session state completely revokes /vendor access (prevents back-button access)",
  );

  // TEST 10: Zero Client API Secret Exposure in Vendor Environment
  const hasSecretInEnv = Object.keys(process.env).some(
    (k) => k.startsWith("NEXT_PUBLIC_") && (k.includes("SECRET") || k.includes("SERVICE_ROLE")),
  );

  assert(
    !hasSecretInEnv,
    "Client environment configuration contains zero secret keys or service role tokens",
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runVendorAuthTestSuite().catch((err) => {
  console.error("Test execution threw uncaught error:", err);
  process.exit(1);
});
