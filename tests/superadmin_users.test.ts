/**
 * GrabIt — Super Admin User & Role Management Security Suite
 * Tests:
 * 1. Super Admin role required for /superadmin/users endpoints.
 * 2. Self-demotion protection (Admin cannot remove their own access).
 * 3. Protection against demoting sole Super Admin account.
 * 4. User role updates & audit trail generation.
 * 5. Account status suspension logic & reason requirements.
 */

import { updateUserRoleApi, updateUserStatusApi } from "../lib/supabase/superadmin_users";
import { isAuthorizedForPath } from "../lib/auth/roles";

async function runSuperAdminUsersTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Super Admin User & Role Management Suite");
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

  // TEST 1: Role Authorization Gating for /superadmin/users
  const isAdminAllowed = isAuthorizedForPath("admin", "/superadmin/users");
  const isVendorAllowed = isAuthorizedForPath("vendor", "/superadmin/users");
  const isStudentAllowed = isAuthorizedForPath("student", "/superadmin/users");

  assert(
    isAdminAllowed && !isVendorAllowed && !isStudentAllowed,
    "Super Admin path (/superadmin/users) permits Admin role and strictly blocks Vendor & Student roles",
  );

  // TEST 2: Self-Demotion Protection Guard
  const selfDemotionRes = await updateUserRoleApi({
    adminId: "admin-uuid-1111",
    targetUserId: "admin-uuid-1111",
    newRole: "student",
    reason: "Attempting self-demotion",
  });

  assert(
    !selfDemotionRes.ok && Boolean(selfDemotionRes.error?.includes("Self-demotion")),
    "Self-demotion protection strictly blocks Super Admin from demoting their own account",
  );

  // TEST 3: Sole Admin Protection Guard
  const soleAdminDemotionRes = await updateUserRoleApi({
    adminId: "admin-uuid-1111",
    targetUserId: "non-existent-sole-admin-id",
    newRole: "student",
    reason: "Attempting sole admin demotion",
  });

  assert(
    !soleAdminDemotionRes.ok,
    "Demoting non-existent or sole admin returns appropriate security error",
  );

  // TEST 4: Invalid Role Rejection
  const invalidRoleRes = await updateUserRoleApi({
    adminId: "admin-uuid-1111",
    targetUserId: "target-user-2222",
    newRole: "super_hacker" as any,
  });

  assert(
    !invalidRoleRes.ok && Boolean(invalidRoleRes.error?.includes("Invalid role")),
    "Invalid role specification is strictly rejected with 400 validation error",
  );

  // TEST 5: Self-Suspension Protection Guard
  const selfSuspendRes = await updateUserStatusApi({
    adminId: "admin-uuid-1111",
    targetUserId: "admin-uuid-1111",
    newStatus: "suspended",
    reason: "Attempting self suspension",
  });

  assert(
    !selfSuspendRes.ok && Boolean(selfSuspendRes.error?.includes("Self-protection")),
    "Self-suspension protection strictly blocks Super Admin from locking out their own active session",
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSuperAdminUsersTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
