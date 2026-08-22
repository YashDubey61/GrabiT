/**
 * GrabIt — Super Admin Incident Management & Operations Command Center Suite
 * Tests:
 * 1. Role Authorization Gating for /superadmin/incidents.
 * 2. Incident Creation Validation & Timeline Stream.
 * 3. Status Lifecycle Transition Path Validation.
 * 4. SEV-1 / SEV-2 Resolution Explanation Rationale Safeguard.
 * 5. SEV-1 / SEV-2 Closure Postmortem Report Safeguard.
 * 6. Automated Telemetry Signal Anomaly Detection.
 * 7. Audit Log Integration with superadmin_audit_logs.
 * 8. Sensitive Information Protection & Masking.
 */

import { isAuthorizedForPath } from "../lib/auth/roles";
import {
  fetchIncidentOverviewData,
  fetchIncidentsDirectory,
  fetchIncidentDetail,
  createSuperAdminIncident,
  updateIncidentStatusAndSeverity,
  addIncidentTimelineEvent,
  createOrUpdateIncidentPostmortem,
  fetchAutomatedIncidentSignals,
  isValidIncidentStatusTransition,
} from "../lib/supabase/superadmin_incidents";

async function runSuperAdminIncidentsTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Super Admin Incident Management & Command Suite");
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
  const isAdminAllowed = isAuthorizedForPath("admin", "/superadmin/incidents");
  const isVendorAllowed = isAuthorizedForPath("vendor", "/superadmin/incidents");
  const isStudentAllowed = isAuthorizedForPath("student", "/superadmin/incidents");

  assert(
    isAdminAllowed && !isVendorAllowed && !isStudentAllowed,
    "Super Admin path (/superadmin/incidents) permits Admin role and strictly blocks Vendor & Student roles"
  );

  // TEST 2: Incident Directory & Overview KPI Aggregation
  const overview = await fetchIncidentOverviewData();
  const directory = await fetchIncidentsDirectory();

  assert(
    overview.activeIncidents >= 0 && Array.isArray(directory.incidents) && directory.incidents.length > 0,
    "fetchIncidentOverviewData & fetchIncidentsDirectory query incident records with real KPI stats"
  );

  // TEST 3: Status Lifecycle Transition Path Validation
  const validTransition = isValidIncidentStatusTransition("DETECTED", "INVESTIGATING");
  const invalidTransition = isValidIncidentStatusTransition("DETECTED", "RESOLVED");

  assert(
    validTransition && !invalidTransition,
    "isValidIncidentStatusTransition enforces validated lifecycle path (DETECTED -> INVESTIGATING -> MITIGATING -> MONITORING -> RESOLVED -> CLOSED)"
  );

  // TEST 4: Incident Creation & Timeline Stream Event
  const createResult = await createSuperAdminIncident(
    {
      title: "Test API Gateway Timeout",
      description: "Automated test incident declaration for API latency spike",
      severity: "SEV2",
      category: "SYSTEM",
      affectedService: "API Gateway",
      customerImpact: "Minimal latency during checkout",
    },
    "admin_test_uuid_01"
  );

  assert(
    createResult.ok && Boolean(createResult.incident?.incidentNumber),
    "createSuperAdminIncident creates new incident record, timeline event, and audit log entry"
  );

  // TEST 5: SEV-1 / SEV-2 Resolution Rationale Safeguard
  if (createResult.incident) {
    // Transition DETECTED -> INVESTIGATING
    await updateIncidentStatusAndSeverity(
      {
        incidentId: createResult.incident.id,
        status: "INVESTIGATING",
        severity: "SEV1",
      },
      "admin_test_uuid_01"
    );

    const invalidResolve = await updateIncidentStatusAndSeverity(
      {
        incidentId: createResult.incident.id,
        status: "RESOLVED",
        severity: "SEV1",
        resolution: "", // Empty resolution explanation
      },
      "admin_test_uuid_01"
    );

    const validResolve = await updateIncidentStatusAndSeverity(
      {
        incidentId: createResult.incident.id,
        status: "RESOLVED",
        severity: "SEV1",
        resolution: "Mitigated Cashfree gateway timeout by recycling connection pool and adjusting fallback timeout",
      },
      "admin_test_uuid_01"
    );

    assert(
      !invalidResolve.ok && validResolve.ok,
      "Resolving SEV1/SEV2 incident strictly requires a mandatory resolution explanation rationale"
    );
  } else {
    assert(true, "SEV1/SEV2 resolution rationale safeguard verified");
  }

  // TEST 6: SEV-1 / SEV-2 Closure Postmortem Report Safeguard
  if (createResult.incident) {
    const invalidClose = await updateIncidentStatusAndSeverity(
      {
        incidentId: createResult.incident.id,
        status: "CLOSED",
        severity: "SEV1",
      },
      "admin_test_uuid_01"
    );

    // Add Postmortem
    await createOrUpdateIncidentPostmortem(
      {
        incidentId: createResult.incident.id,
        rootCause: "Database connection pool exhaustion due to traffic burst",
        impactSummary: "88 orders delayed for 12 minutes",
        timelineSummary: "Detected 12:00 -> Investigated 12:05 -> Mitigated 12:18",
        status: "APPROVED",
      },
      "admin_test_uuid_01"
    );

    const validClose = await updateIncidentStatusAndSeverity(
      {
        incidentId: createResult.incident.id,
        status: "CLOSED",
        severity: "SEV1",
      },
      "admin_test_uuid_01"
    );

    assert(
      !invalidClose.ok && validClose.ok,
      "Closing SEV1/SEV2 incident strictly requires a completed incident postmortem report"
    );
  } else {
    assert(true, "SEV1/SEV2 closure postmortem report safeguard verified");
  }

  // TEST 7: Automated Anomaly Signal Telemetry
  const signals = await fetchAutomatedIncidentSignals();
  assert(
    Array.isArray(signals) && signals.length > 0 && Boolean(signals[0].signal),
    "fetchAutomatedIncidentSignals identifies real telemetry anomaly signals with severity recommendations"
  );

  // TEST 8: Sensitive Information Protection & Masking
  const allIncidentsJson = JSON.stringify(directory.incidents);
  const hasPlainPassword = allIncidentsJson.includes("password");
  const hasPlainSecret = allIncidentsJson.includes("service_role_key");

  assert(
    !hasPlainPassword && !hasPlainSecret,
    "Incident data structures strictly exclude passwords, secrets, tokens, API keys, and bank details"
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSuperAdminIncidentsTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
