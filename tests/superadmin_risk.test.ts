/**
 * GrabIt — Super Admin Fraud & Risk Center Security Suite
 * Tests:
 * 1. Role Authorization Gating for /superadmin/risk.
 * 2. Server-side deterministic Risk Score & Level calculation.
 * 3. Mandatory resolution explanation requirement.
 * 4. Investigation note content validation.
 * 5. Invalid status specification rejection.
 * 6. CSV risk report generation without sensitive PII.
 */

import {
  calculateRiskScore,
  updateRiskCaseStatusApi,
  addRiskCaseNoteApi,
  generateRiskReportCsv,
} from "../lib/supabase/superadmin_risk";
import { isAuthorizedForPath } from "../lib/auth/roles";

async function runRiskTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Super Admin Fraud & Risk Center Security Suite");
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

  // TEST 1: Role Authorization Gating for /superadmin/risk
  const isAdminAllowed = isAuthorizedForPath("admin", "/superadmin/risk");
  const isVendorAllowed = isAuthorizedForPath("vendor", "/superadmin/risk");
  const isStudentAllowed = isAuthorizedForPath("student", "/superadmin/risk");

  assert(
    isAdminAllowed && !isVendorAllowed && !isStudentAllowed,
    "Risk Center route strictly permits Admin role and blocks Vendor & Student roles",
  );

  // TEST 2: Server-side Risk Score & Level Calculation
  const signals = [
    { code: "HIGH_CANCELLATION", label: "Cancellation", points: 25, description: "Test", category: "Risk Signal" as const, eventTime: "" },
    { code: "VELOCITY", label: "Velocity", points: 20, description: "Test", category: "Risk Signal" as const, eventTime: "" },
    { code: "COUPON", label: "Coupon", points: 18, description: "Test", category: "Risk Signal" as const, eventTime: "" },
    { code: "PAYMENT", label: "Payment", points: 20, description: "Test", category: "Risk Signal" as const, eventTime: "" },
  ];

  const calculated = calculateRiskScore(signals);
  assert(
    calculated.score === 83 && calculated.level === "CRITICAL",
    "Risk Score calculation generates deterministic score (83) and CRITICAL risk level",
  );

  // TEST 3: Mandatory Resolution Explanation Requirement
  const resolveNoReason = await updateRiskCaseStatusApi({
    adminId: "admin-uuid-1",
    caseId: "rc-001",
    newStatus: "RESOLVED",
    resolution: "",
  });

  assert(
    !resolveNoReason.ok && Boolean(resolveNoReason.error?.includes("resolution explanation is mandatory")),
    "Resolving a risk case without a mandatory resolution explanation is strictly blocked",
  );

  // TEST 4: Investigation Note Content Validation
  const emptyNoteRes = await addRiskCaseNoteApi({
    adminId: "admin-uuid-1",
    caseId: "rc-001",
    noteContent: "   ",
  });

  assert(
    !emptyNoteRes.ok && Boolean(emptyNoteRes.error?.includes("cannot be empty")),
    "Adding an empty investigation note is strictly blocked",
  );

  // TEST 5: Invalid Status Specification Rejection
  const invalidStatusRes = await updateRiskCaseStatusApi({
    adminId: "admin-uuid-1",
    caseId: "rc-001",
    newStatus: "INVALID_STATUS" as any,
  });

  assert(
    !invalidStatusRes.ok && Boolean(invalidStatusRes.error?.includes("Invalid case status")),
    "Invalid risk case status specification returns a 400 validation error",
  );

  // TEST 6: CSV Risk Report Generation (No PII)
  const csvOutput = await generateRiskReportCsv({});
  assert(
    csvOutput.includes("Case ID,Entity Type") && !csvOutput.includes("password") && !csvOutput.includes("bank_account"),
    "Exported Risk Report CSV contains aggregate risk metadata without exposing sensitive customer PII",
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runRiskTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
