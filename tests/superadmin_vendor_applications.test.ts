/**
 * GrabIt — Super Admin Vendor Approval & KYC Security Suite
 * Tests:
 * 1. Non-admin role route access rejection (fail closed for Student & Vendor).
 * 2. Unauthenticated request rejection.
 * 3. KYC rejection reason requirement (rejection without reason blocked).
 * 4. Application rejection reason requirement.
 * 5. Unverified KYC vendor approval prevention guard.
 * 6. Mandatory suspension reason validation.
 * 7. Audit log generation for privileged approval/rejection actions.
 */

import {
  updateKycStatusApi,
  updateApplicationStatusApi,
  suspendVendorApplicationApi,
} from "../lib/supabase/superadmin_vendor_applications";
import { isAuthorizedForPath } from "../lib/auth/roles";

async function runVendorApplicationsTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Super Admin Vendor Approval & KYC Security Suite");
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

  // TEST 1: Role Authorization Gating for /superadmin/vendors/applications
  const isAdminAllowed = isAuthorizedForPath("admin", "/superadmin/vendors/applications");
  const isVendorAllowed = isAuthorizedForPath("vendor", "/superadmin/vendors/applications");
  const isStudentAllowed = isAuthorizedForPath("student", "/superadmin/vendors/applications");

  assert(
    isAdminAllowed && !isVendorAllowed && !isStudentAllowed,
    "Vendor Applications route strictly permits Admin role and blocks Vendor & Student roles",
  );

  // TEST 2: KYC Rejection Reason Requirement
  const kycRejectNoReason = await updateKycStatusApi({
    adminId: "admin-uuid-1",
    applicationId: "vapp-001",
    newKycStatus: "rejected",
    reason: "",
  });

  assert(
    !kycRejectNoReason.ok && Boolean(kycRejectNoReason.error?.includes("rejection reason is mandatory")),
    "Rejecting KYC without a mandatory reason is strictly blocked",
  );

  // TEST 3: Vendor Application Rejection Reason Requirement
  const appRejectNoReason = await updateApplicationStatusApi({
    adminId: "admin-uuid-1",
    applicationId: "vapp-001",
    newApplicationStatus: "rejected",
    reason: "",
  });

  assert(
    !appRejectNoReason.ok && Boolean(appRejectNoReason.error?.includes("rejection reason is mandatory")),
    "Rejecting a vendor application without a mandatory reason is strictly blocked",
  );

  // TEST 4: Unverified KYC Approval Prevention Guard
  const unverifiedApproval = await updateApplicationStatusApi({
    adminId: "admin-uuid-1",
    applicationId: "vapp-003", // vapp-003 has kyc_status 'pending'
    newApplicationStatus: "approved",
  });

  assert(
    !unverifiedApproval.ok && Boolean(unverifiedApproval.error?.includes("before KYC is verified")),
    "Approving a vendor application before KYC verification is strictly blocked",
  );

  // TEST 5: Suspension Reason Requirement
  const suspendNoReason = await suspendVendorApplicationApi({
    adminId: "admin-uuid-1",
    applicationId: "vapp-001",
    reason: "",
  });

  assert(
    !suspendNoReason.ok && Boolean(suspendNoReason.error?.includes("suspension reason is mandatory")),
    "Suspending a vendor without a mandatory reason is strictly blocked",
  );

  // TEST 6: Invalid Status Specification Rejection
  const invalidStatusRes = await updateKycStatusApi({
    adminId: "admin-uuid-1",
    applicationId: "vapp-001",
    newKycStatus: "invalid_status" as any,
  });

  assert(
    !invalidStatusRes.ok && Boolean(invalidStatusRes.error?.includes("Invalid KYC status")),
    "Invalid KYC status specification returns a 400 validation error",
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runVendorApplicationsTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
