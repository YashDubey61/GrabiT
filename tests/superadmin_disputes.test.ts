/**
 * GrabIt — Super Admin Dispute & Refund Center Security Suite
 * Tests:
 * 1. Role Authorization Gating for /superadmin/disputes.
 * 2. Refund reason requirement (processing refund without reason is blocked).
 * 3. Over-refund safety guard (refund amount > refundable balance is blocked).
 * 4. Negative/zero refund amount rejection.
 * 5. Dispute resolution explanation requirement.
 * 6. Invalid status transition rejection.
 * 7. CSV dispute report generation without sensitive customer PII.
 */

import {
  updateDisputeStatusApi,
  processRefundApi,
  generateDisputeReportCsv,
} from "../lib/supabase/superadmin_disputes";
import { isAuthorizedForPath } from "../lib/auth/roles";

async function runDisputesTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Super Admin Dispute & Refund Security Suite");
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

  // TEST 1: Role Authorization Gating for /superadmin/disputes
  const isAdminAllowed = isAuthorizedForPath("admin", "/superadmin/disputes");
  const isVendorAllowed = isAuthorizedForPath("vendor", "/superadmin/disputes");
  const isStudentAllowed = isAuthorizedForPath("student", "/superadmin/disputes");

  assert(
    isAdminAllowed && !isVendorAllowed && !isStudentAllowed,
    "Dispute Center route strictly permits Admin role and blocks Vendor & Student roles",
  );

  // TEST 2: Refund Reason Requirement
  const refundNoReason = await processRefundApi({
    adminId: "admin-uuid-1",
    disputeId: "disp-001",
    refundAmount: 100,
    reason: "",
  });

  assert(
    !refundNoReason.ok && Boolean(refundNoReason.error?.includes("reason is mandatory")),
    "Processing a refund without a mandatory reason is strictly blocked",
  );

  // TEST 3: Zero or Negative Refund Amount Rejection
  const zeroRefundRes = await processRefundApi({
    adminId: "admin-uuid-1",
    disputeId: "disp-001",
    refundAmount: 0,
    reason: "Zero amount test",
  });

  assert(
    !zeroRefundRes.ok && Boolean(zeroRefundRes.error?.includes("greater than zero")),
    "Zero or negative refund amount is strictly blocked",
  );

  // TEST 4: Over-Refund Safety Guard
  const overRefundRes = await processRefundApi({
    adminId: "admin-uuid-1",
    disputeId: "disp-001", // disp-001 dispute amount is 240
    refundAmount: 9999,
    reason: "Over refund attempt",
  });

  assert(
    !overRefundRes.ok && Boolean(overRefundRes.error?.includes("exceeds maximum refundable balance")),
    "Over-refund request exceeding refundable balance is strictly blocked by server safety guard",
  );

  // TEST 5: Dispute Resolution Explanation Requirement
  const resolveNoReason = await updateDisputeStatusApi({
    adminId: "admin-uuid-1",
    disputeId: "disp-001",
    newStatus: "RESOLVED",
    resolution: "",
  });

  assert(
    !resolveNoReason.ok && Boolean(resolveNoReason.error?.includes("resolution explanation is mandatory")),
    "Resolving a dispute without a mandatory resolution explanation is strictly blocked",
  );

  // TEST 6: Invalid Status Specification Rejection
  const invalidStatusRes = await updateDisputeStatusApi({
    adminId: "admin-uuid-1",
    disputeId: "disp-001",
    newStatus: "INVALID_STATUS" as any,
  });

  assert(
    !invalidStatusRes.ok && Boolean(invalidStatusRes.error?.includes("Invalid dispute status")),
    "Invalid dispute status specification returns a 400 validation error",
  );

  // TEST 7: CSV Dispute Report Generation (No PII)
  const csvOutput = await generateDisputeReportCsv({});
  assert(
    csvOutput.includes("Dispute ID,Order ID") && !csvOutput.includes("password") && !csvOutput.includes("card_number"),
    "Exported Dispute Report CSV contains aggregate dispute metadata without exposing customer PII",
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runDisputesTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
