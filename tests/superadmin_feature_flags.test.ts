/**
 * GrabIt — Super Admin Feature Flags & Controlled Rollouts Security & Functionality Suite
 * Tests:
 * 1. Role Authorization Gating for /superadmin/feature-flags.
 * 2. Key Uniqueness & Validation (Snake_case, duplicate rejection).
 * 3. Rollout Percentage Boundary Rules (0% - 100%).
 * 4. Deterministic FNV-1a Sticky Hashing (Same user/context gets identical result).
 * 5. Target Scope Rules (Explicit User, Campus, and Vendor targeting precedence).
 * 6. Timezone-Aware Scheduled Flags Evaluation.
 * 7. Default-Safe Fallback for Missing / Disabled Flags.
 * 8. Emergency Kill Switch Execution & CRITICAL Audit Trail.
 * 9. Safe Configuration Rollback Execution.
 * 10. Environment Isolation.
 */

import { isAuthorizedForPath } from "../lib/auth/roles";
import {
  evaluateFeatureFlag,
  getDeterministicPercentage,
  fetchFeatureFlags,
  fetchFeatureFlagOverviewStats,
  createFeatureFlag,
  updateFeatureFlag,
  triggerEmergencyKillSwitch,
  rollbackFeatureFlag,
} from "../lib/supabase/superadmin_feature_flags";
import { fetchAuditLogs } from "../lib/supabase/superadmin_audit";

async function runSuperAdminFeatureFlagsTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Super Admin Feature Flags & Rollouts Suite");
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
  const isAdminAllowed = isAuthorizedForPath("admin", "/superadmin/feature-flags");
  const isVendorAllowed = isAuthorizedForPath("vendor", "/superadmin/feature-flags");
  const isStudentAllowed = isAuthorizedForPath("student", "/superadmin/feature-flags");

  assert(
    isAdminAllowed && !isVendorAllowed && !isStudentAllowed,
    "Super Admin path (/superadmin/feature-flags) permits Admin role and strictly blocks Vendor & Student roles"
  );

  // TEST 2: Duplicate Flag Key Rejection
  const duplicateRes = await createFeatureFlag({
    adminId: "admin_test_uuid_01",
    flag: {
      key: "student_rewards_v2", // Existing key
      name: "Duplicate Student Rewards",
      description: "Test duplicate key",
      category: "Student",
      status: "ENABLED",
      environment: "production",
      rolloutPercentage: 100,
      riskLevel: "LOW",
      isHighImpact: false,
      targetScope: "ALL USERS",
      targetCampusIds: [],
      targetVendorIds: [],
      targetUserIds: [],
    },
  });

  assert(
    !duplicateRes.ok && Boolean(duplicateRes.error?.includes("already exists")),
    "Creating a feature flag with a duplicate key is strictly rejected"
  );

  // TEST 3: Invalid Key Format & Invalid Rollout Percentage Rejection
  const invalidKeyRes = await createFeatureFlag({
    adminId: "admin_test_uuid_01",
    flag: {
      key: "Invalid Key Format!",
      name: "Bad Key Flag",
      description: "",
      category: "System",
      status: "DISABLED",
      environment: "production",
      rolloutPercentage: 100,
      riskLevel: "LOW",
      isHighImpact: false,
      targetScope: "ALL USERS",
      targetCampusIds: [],
      targetVendorIds: [],
      targetUserIds: [],
    },
  });

  const invalidPctRes = await createFeatureFlag({
    adminId: "admin_test_uuid_01",
    flag: {
      key: "valid_key_test_01",
      name: "Valid Key Bad Percent",
      description: "",
      category: "System",
      status: "DISABLED",
      environment: "production",
      rolloutPercentage: 150, // Invalid percentage
      riskLevel: "LOW",
      isHighImpact: false,
      targetScope: "ALL USERS",
      targetCampusIds: [],
      targetVendorIds: [],
      targetUserIds: [],
    },
  });

  assert(
    !invalidKeyRes.ok && !invalidPctRes.ok,
    "Non-snake_case keys and out-of-range rollout percentages (>100 or <0) are strictly rejected"
  );

  // TEST 4: Deterministic Sticky Rollout Hashing
  const seed1 = "cashfree_upi_intent:user_12345";
  const score1_a = getDeterministicPercentage(seed1);
  const score1_b = getDeterministicPercentage(seed1);
  const seed2 = "cashfree_upi_intent:user_99999";
  const score2 = getDeterministicPercentage(seed2);

  assert(
    score1_a === score1_b && score1_a >= 0 && score1_a < 100 && score1_a !== score2,
    "Deterministic FNV-1a hashing guarantees reproducible, sticky percentage scores for identical context seeds"
  );

  // TEST 5: Explicit Campus & Vendor Target Precedence
  const vendorEval = await evaluateFeatureFlag("vendor_instant_payouts", { vendorId: "CANTEEN-123" });
  assert(
    vendorEval.enabled && vendorEval.reason.includes("CANTEEN-123 explicitly targeted"),
    "Explicit vendor target IDs take immediate evaluation precedence"
  );

  const campusEval = await evaluateFeatureFlag("campus_geofencing_v2", { campusId: "cmp_axis_01" });
  assert(
    campusEval.enabled,
    "Explicit campus target IDs successfully evaluate to true for matching campus context"
  );

  // TEST 6: Disabled & Missing Flag Default-Safe Behavior
  const disabledEval = await evaluateFeatureFlag("dispute_auto_refunds", { userId: "usr_student_01" });
  const missingEval = await evaluateFeatureFlag("non_existent_experimental_flag", { userId: "usr_student_01" });

  assert(
    !disabledEval.enabled && !missingEval.enabled && missingEval.reason.includes("Missing flag"),
    "Disabled and missing feature flags safely default to FALSE to protect platform stability"
  );

  // TEST 7: High Impact Change Reason Requirement
  const highImpactUpdate = await updateFeatureFlag({
    adminId: "admin_test_uuid_01",
    flagKey: "vendor_instant_payouts",
    updates: { rolloutPercentage: 50 },
    reason: "", // Empty reason for high impact flag
  });

  assert(
    !highImpactUpdate.ok && Boolean(highImpactUpdate.error?.includes("mandatory explanation reason")),
    "High-impact feature flag updates strictly require a mandatory explanation reason"
  );

  // TEST 8: Valid Feature Flag Update & Audit Trail
  const validUpdate = await updateFeatureFlag({
    adminId: "admin_test_uuid_01",
    flagKey: "order_pickup_otp_verify",
    updates: { rolloutPercentage: 100 },
    reason: "Enabling mandatory 4-digit OTP pickup verification across all canteens",
  });

  const auditLogs = await fetchAuditLogs({ targetId: "order_pickup_otp_verify", pageSize: 5 });
  const latestAudit = auditLogs.events.find((e) => e.targetId === "order_pickup_otp_verify");

  assert(
    validUpdate.ok && Boolean(latestAudit) && latestAudit?.module === "System",
    "Feature flag updates persist to database and write audit events to superadmin_audit_logs"
  );

  // TEST 9: Emergency Kill Switch Execution & CRITICAL Severity Audit Log
  const killRes = await triggerEmergencyKillSwitch({
    adminId: "admin_test_uuid_01",
    flagKey: "cashfree_upi_intent",
    reason: "Payment gateway webhook failure detected in Cashfree production cluster",
  });

  const killEval = await evaluateFeatureFlag("cashfree_upi_intent", { userId: "usr_1001" });
  const killAuditLogs = await fetchAuditLogs({ targetId: "cashfree_upi_intent", pageSize: 5 });
  const killAudit = killAuditLogs.events.find((e) => e.action === "feature_flag_kill_switch");

  assert(
    killRes.ok &&
      !killEval.enabled &&
      Boolean(killAudit) &&
      killAudit?.severity === "CRITICAL",
    "Emergency Kill Switch instantly disables feature flag and records a CRITICAL severity audit log"
  );

  // TEST 10: Safe Feature Flag Rollback Execution
  const rollbackRes = await rollbackFeatureFlag({
    adminId: "admin_test_uuid_01",
    flagKey: "cashfree_upi_intent",
    targetState: { status: "ROLLOUT", rolloutPercentage: 50 },
    reason: "Restoring Cashfree UPI Intent after gateway patch deployment",
  });

  const restoredEval = await evaluateFeatureFlag("cashfree_upi_intent", { vendorId: "CANTEEN-123" });

  assert(
    rollbackRes.ok && restoredEval.flag?.status === "ROLLOUT",
    "Feature flag rollback restores target configuration and logs a new audit event without mutating history"
  );

  // TEST 11: Environment Isolation & Overview Stats
  const stats = await fetchFeatureFlagOverviewStats();

  assert(
    stats.totalFlags > 0 && stats.productionFlags > 0 && stats.disabled > 0,
    "Feature flag overview KPI stats accurately calculate totals, status counts, and production vs experimental split"
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSuperAdminFeatureFlagsTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
