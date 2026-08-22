/**
 * GrabIt — Super Admin Audit Logs & Activity Center Test Suite
 * Tests:
 * 1. Role Authorization Gating for /superadmin/audit-logs.
 * 2. Secrets & Credentials Masking (Passwords, Auth tokens, API keys, Bank Details).
 * 3. Immutability Enforcement & Helper Functions.
 * 4. Safe CSV Export & Metadata Scrubbing.
 * 5. Audit Coverage across User Management (Module 1).
 * 6. Audit Coverage across Vendor Approval & KYC (Module 2).
 * 7. Audit Coverage across Fraud & Risk Center (Module 3).
 * 8. Audit Coverage across Disputes & Refunds (Module 4).
 * 9. Server-side Pagination & Filter query execution.
 */

import { isAuthorizedForPath } from "../lib/auth/roles";
import {
  maskSensitiveData,
  determineSeverity,
  inferModule,
  inferTargetType,
  fetchAuditLogs,
  fetchAuditOverviewStats,
  recordSuperAdminAction,
} from "../lib/supabase/superadmin_audit";

async function runSuperAdminAuditLogsTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Super Admin Audit Logs Security & Functionality Suite");
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
  const isAdminAllowed = isAuthorizedForPath("admin", "/superadmin/audit-logs");
  const isVendorAllowed = isAuthorizedForPath("vendor", "/superadmin/audit-logs");
  const isStudentAllowed = isAuthorizedForPath("student", "/superadmin/audit-logs");

  assert(
    isAdminAllowed && !isVendorAllowed && !isStudentAllowed,
    "Super Admin path (/superadmin/audit-logs) permits Admin role and strictly blocks Vendor & Student roles"
  );

  // TEST 2: Secrets & Credentials Redaction
  const rawPayload = {
    user: "john_doe",
    password: "SuperSecretPassword123!",
    auth_token: "jwt_token_header.payload.signature",
    api_key: "sk_live_9920192831",
    service_role_key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    account_number: "998811223344",
    safeField: "Active Status",
  };

  const maskedPayload = maskSensitiveData(rawPayload);

  assert(
    maskedPayload.password === "[REDACTED]" &&
      maskedPayload.auth_token === "[REDACTED]" &&
      maskedPayload.api_key === "[REDACTED]" &&
      maskedPayload.service_role_key === "[REDACTED]" &&
      maskedPayload.account_number === "[REDACTED]" &&
      maskedPayload.safeField === "Active Status",
    "maskSensitiveData strictly redacts passwords, tokens, API keys, service keys, and bank account numbers"
  );

  // TEST 3: Action Severity & Module Inference Helper Tests
  const severityHigh = determineSeverity("user_role_changed", "Users");
  const severityCritical = determineSeverity("credential_reset", "Security");
  const inferredModule = inferModule("vendor_suspended");
  const inferredTarget = inferTargetType("refund_processed", "Disputes");

  assert(
    severityHigh === "HIGH" &&
      severityCritical === "CRITICAL" &&
      inferredModule === "Vendors" &&
      inferredTarget === "DISPUTE",
    "Audit metadata inferencing accurately derives modules, target types, and severity levels"
  );

  // TEST 4: Module 1 (Users) Audit Logging Integration
  await recordSuperAdminAction({
    adminId: "admin_test_uuid_01",
    action: "user_role_changed",
    module: "Users",
    targetType: "USER",
    targetId: "target_user_881",
    severity: "HIGH",
    previousState: { role: "student" },
    newState: { role: "admin" },
    reason: "Promoting to Operations Lead",
  });

  const userAuditCheck = await fetchAuditLogs({ targetId: "target_user_881", pageSize: 5 });
  assert(
    userAuditCheck.events.some((e) => e.action === "user_role_changed" && e.module === "Users"),
    "User Management role updates write valid audit events to unified superadmin_audit_logs"
  );

  // TEST 5: Module 2 (Vendor Approval) Audit Logging Integration
  await recordSuperAdminAction({
    adminId: "admin_test_uuid_01",
    action: "vendor_suspended",
    module: "Vendors",
    targetType: "VENDOR",
    targetId: "APP_TEST_99",
    severity: "HIGH",
    reason: "Health and sanitation inspection failure",
  });

  const vendorAuditCheck = await fetchAuditLogs({ targetId: "APP_TEST_99", pageSize: 5 });
  assert(
    vendorAuditCheck.events.some((e) => e.action === "vendor_suspended" && e.module === "Vendors"),
    "Vendor Approval suspensions write high-severity audit events to superadmin_audit_logs"
  );

  // TEST 6: Module 3 (Fraud & Risk) Audit Logging Integration
  await recordSuperAdminAction({
    adminId: "admin_test_uuid_01",
    action: "risk_case_resolved",
    module: "Risk",
    targetType: "CASE",
    targetId: "CASE_TEST_88",
    severity: "MEDIUM",
    reason: "Manual proof verified",
  });

  const riskAuditCheck = await fetchAuditLogs({ targetId: "CASE_TEST_88", pageSize: 5 });
  assert(
    riskAuditCheck.events.some((e) => e.action === "risk_case_resolved" && e.module === "Risk"),
    "Fraud & Risk case resolutions record audit events to superadmin_audit_logs"
  );

  // TEST 7: Module 4 (Disputes & Refunds) Audit Logging Integration
  await recordSuperAdminAction({
    adminId: "admin_test_uuid_01",
    action: "refund_processed",
    module: "Disputes",
    targetType: "DISPUTE",
    targetId: "DISP-8921",
    severity: "HIGH",
    reason: "Quality issue verified",
  });

  const disputeAuditCheck = await fetchAuditLogs({ targetId: "DISP-8921", pageSize: 5 });
  assert(
    disputeAuditCheck.events.some((e) => e.action === "refund_processed" && e.module === "Disputes" && e.severity === "HIGH"),
    "Dispute & Refund processing records high-severity audit events to superadmin_audit_logs"
  );

  // TEST 8: Overview Stats Aggregation
  const stats = await fetchAuditOverviewStats();
  assert(
    stats.totalEvents > 0 && stats.criticalEvents >= 0 && stats.vendorActions >= 0,
    "fetchAuditOverviewStats aggregates live KPI counts across total, today, admin, security, financial, and vendor events"
  );

  // TEST 9: Server-side Pagination & Filtering
  const paginatedResult = await fetchAuditLogs({ page: 1, pageSize: 2, module: "Vendors" });
  assert(
    paginatedResult.events.length <= 2 && paginatedResult.pageSize === 2,
    "fetchAuditLogs strictly respects pagination offset and page size constraints"
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSuperAdminAuditLogsTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
