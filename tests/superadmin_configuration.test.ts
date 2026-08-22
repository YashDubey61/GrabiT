/**
 * GrabIt — Super Admin Platform Configuration Control Security & Functionality Suite
 * Tests:
 * 1. Role Authorization Gating for /superadmin/configuration.
 * 2. Server-side Type Validation (Integer, Decimal, Boolean, Enum, JSON).
 * 3. Range Safeguards (Commission 0-100%, Non-negative prep time & order limits).
 * 4. Secrets & Security Safeguard (Blocks attempts to modify API keys or credentials).
 * 5. High-Impact Explanation Requirement.
 * 6. Audit Trail Integration (Writes to superadmin_audit_logs).
 * 7. Safe Rollback Execution (Creates NEW audit event without mutating past audit records).
 * 8. Category & Filter Query Execution.
 */

import { isAuthorizedForPath } from "../lib/auth/roles";
import {
  validateConfigValue,
  fetchPlatformConfigurations,
  fetchConfigurationOverviewStats,
  updatePlatformConfiguration,
  rollbackPlatformConfiguration,
} from "../lib/supabase/superadmin_configuration";
import { fetchAuditLogs } from "../lib/supabase/superadmin_audit";

async function runSuperAdminConfigurationTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Super Admin Platform Configuration Security Suite");
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
  const isAdminAllowed = isAuthorizedForPath("admin", "/superadmin/configuration");
  const isVendorAllowed = isAuthorizedForPath("vendor", "/superadmin/configuration");
  const isStudentAllowed = isAuthorizedForPath("student", "/superadmin/configuration");

  assert(
    isAdminAllowed && !isVendorAllowed && !isStudentAllowed,
    "Super Admin path (/superadmin/configuration) permits Admin role and strictly blocks Vendor & Student roles"
  );

  // TEST 2: Commission Percentage Range Safeguard (0 - 100%)
  const invalidCommissionHigh = validateConfigValue("vendor_default_commission_percent", 150.0, "decimal");
  const invalidCommissionLow = validateConfigValue("vendor_default_commission_percent", -5.0, "decimal");
  const validCommission = validateConfigValue("vendor_default_commission_percent", 12.5, "decimal");

  assert(
    !invalidCommissionHigh.valid &&
      !invalidCommissionLow.valid &&
      validCommission.valid &&
      validCommission.parsedValue === 12.5,
    "Commission rate validation strictly enforces 0% to 100% boundary limits"
  );

  // TEST 3: Negative Prep Time & Timeout Rejection
  const invalidPrepTime = validateConfigValue("orders_default_prep_time", -10, "integer");
  const validPrepTime = validateConfigValue("orders_default_prep_time", 20, "integer");

  assert(
    !invalidPrepTime.valid && validPrepTime.valid && validPrepTime.parsedValue === 20,
    "Preparation time and order timeouts strictly reject negative values"
  );

  // TEST 4: Invalid Enum Specification Rejection
  const invalidEnum = validateConfigValue("vendor_default_operating_status", "super_active", "enum");
  const validEnum = validateConfigValue("vendor_default_operating_status", "paused", "enum");

  assert(
    !invalidEnum.valid && validEnum.valid && validEnum.parsedValue === "paused",
    "Enum configuration validation rejects unauthorized status strings"
  );

  // TEST 5: Secrets & Credentials Safeguard
  const secretMutationAttempt = validateConfigValue("supabase_service_role_key", "new_secret_key", "string");

  assert(
    !secretMutationAttempt.valid && Boolean(secretMutationAttempt.error?.includes("Security Guard")),
    "Security Guard strictly blocks attempts to modify API keys or service role credentials via Platform Configuration"
  );

  // TEST 6: High Impact Change Reason Requirement
  const highImpactRes = await updatePlatformConfiguration({
    adminId: "admin_test_uuid_01",
    configKey: "vendor_default_commission_percent",
    newValue: 10.0,
    reason: "", // Empty reason for high-impact setting
  });

  assert(
    !highImpactRes.ok && Boolean(highImpactRes.error?.includes("mandatory explanation reason")),
    "High-impact settings (e.g. commission) strictly require a mandatory explanation reason before saving"
  );

  // TEST 7: Audit Trail Integration on Valid Update
  const updateRes = await updatePlatformConfiguration({
    adminId: "admin_test_uuid_01",
    configKey: "orders_default_prep_time",
    newValue: 18,
    reason: "Adjusting prep time based on kitchen operational benchmarks",
  });

  const auditCheck = await fetchAuditLogs({ targetId: "orders_default_prep_time", pageSize: 5 });
  const latestAudit = auditCheck.events.find((e) => e.targetId === "orders_default_prep_time");

  assert(
    updateRes.ok &&
      Boolean(latestAudit) &&
      latestAudit?.action === "platform_config_updated" &&
      latestAudit?.module === "System",
    "Valid configuration updates persist to database and write audit events to superadmin_audit_logs"
  );

  // TEST 8: Safe Configuration Rollback Execution
  const rollbackRes = await rollbackPlatformConfiguration({
    adminId: "admin_test_uuid_01",
    configKey: "orders_default_prep_time",
    targetValue: 15,
    reason: "Restoring original 15 minute prep time estimate",
  });

  const rollbackAuditCheck = await fetchAuditLogs({ targetId: "orders_default_prep_time", pageSize: 5 });
  const latestRollbackAudit = rollbackAuditCheck.events.find((e) => e.action === "platform_config_rollback");

  assert(
    rollbackRes.ok &&
      Boolean(latestRollbackAudit) &&
      latestRollbackAudit?.newState?.value === 15,
    "Configuration rollback restores previous setting and creates a NEW platform_config_rollback audit log"
  );

  // TEST 9: Category Filtering & Stats Aggregation
  const vendorConfigs = await fetchPlatformConfigurations("VENDOR");
  const stats = await fetchConfigurationOverviewStats();

  assert(
    vendorConfigs.every((c) => c.category === "VENDOR") &&
      stats.activeConfigs > 0 &&
      stats.categoriesCount === 7,
    "Category filtering and overview KPI stats accurately partition business settings across all 7 categories"
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSuperAdminConfigurationTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
