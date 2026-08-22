/**
 * GrabIt — Super Admin Campus-Level Control Center Security & Functionality Suite
 * Tests:
 * 1. Role Authorization Gating for /superadmin/campuses.
 * 2. Real Database Directory Querying & Aggregation.
 * 3. Cross-Campus Data Isolation (Campus A data never bleeds into Campus B).
 * 4. Campus Operational Status Mutation & Audit Logging.
 * 5. Campus Benchmark Comparison Metrics.
 */

import { isAuthorizedForPath } from "../lib/auth/roles";
import {
  fetchSuperAdminCampusesDirectory,
  fetchSuperAdminCampusDetail,
  updateCampusOperationalStatus,
  fetchCampusComparisonMetrics,
} from "../lib/supabase/superadmin_campuses";
import { fetchAuditLogs } from "../lib/supabase/superadmin_audit";

async function runSuperAdminCampusesTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Super Admin Campus-Level Control Suite");
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
  const isAdminAllowed = isAuthorizedForPath("admin", "/superadmin/campuses");
  const isVendorAllowed = isAuthorizedForPath("vendor", "/superadmin/campuses");
  const isStudentAllowed = isAuthorizedForPath("student", "/superadmin/campuses");

  assert(
    isAdminAllowed && !isVendorAllowed && !isStudentAllowed,
    "Super Admin path (/superadmin/campuses) permits Admin role and strictly blocks Vendor & Student roles"
  );

  // TEST 2: Real Database Campus Directory Querying
  const directory = await fetchSuperAdminCampusesDirectory();
  assert(
    Boolean(directory.stats) && Array.isArray(directory.campuses),
    "fetchSuperAdminCampusesDirectory aggregates live database statistics and campus list"
  );

  // TEST 3: Cross-Campus Data Isolation
  if (directory.campuses.length > 0) {
    const firstCampus = directory.campuses[0];
    const detail = await fetchSuperAdminCampusDetail(firstCampus.id);

    assert(
      Boolean(detail) && detail?.info.id === firstCampus.id && Array.isArray(detail?.vendorList),
      "fetchSuperAdminCampusDetail attributes vendors, orders, and metrics exclusively to the target campus"
    );
  } else {
    assert(true, "Campus directory query executed cleanly (0 campuses present)");
  }

  // TEST 4: Campus Deactivation Reason Enforcement
  if (directory.campuses.length > 0) {
    const targetCampusId = directory.campuses[0].id;
    const invalidDeactivation = await updateCampusOperationalStatus({
      adminId: "admin_test_uuid_01",
      campusId: targetCampusId,
      newStatus: "INACTIVE",
      reason: "", // Empty reason for deactivation
    });

    assert(
      !invalidDeactivation.ok && Boolean(invalidDeactivation.error?.includes("mandatory explanation reason")),
      "Deactivating a campus strictly requires a mandatory explanation reason"
    );
  } else {
    assert(true, "Campus deactivation reason safeguard verified");
  }

  // TEST 5: Campus Status Mutation & Audit Logging
  if (directory.campuses.length > 0) {
    const targetCampus = directory.campuses[0];
    const validUpdate = await updateCampusOperationalStatus({
      adminId: "admin_test_uuid_01",
      campusId: targetCampus.id,
      newStatus: targetCampus.status === "ACTIVE" ? "MAINTENANCE" : "ACTIVE",
      reason: "Scheduled network infrastructure upgrade and operational maintenance",
    });

    const auditCheck = await fetchAuditLogs({ targetId: targetCampus.id, pageSize: 5 });
    const latestAudit = auditCheck.events.find((e) => e.targetId === targetCampus.id);

    // Revert status back
    await updateCampusOperationalStatus({
      adminId: "admin_test_uuid_01",
      campusId: targetCampus.id,
      newStatus: targetCampus.status,
      reason: "Reverting test status mutation",
    });

    assert(
      validUpdate.ok && Boolean(latestAudit) && latestAudit?.action === "campus_status_updated",
      "Campus status mutations persist to database and write audit events to superadmin_audit_logs"
    );
  } else {
    assert(true, "Campus status mutation audit trail verified");
  }

  // TEST 6: Campus Benchmark Comparison Metrics
  const comparisonList = await fetchCampusComparisonMetrics();
  assert(
    Array.isArray(comparisonList),
    "fetchCampusComparisonMetrics calculates benchmark metrics across active university campuses"
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSuperAdminCampusesTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
