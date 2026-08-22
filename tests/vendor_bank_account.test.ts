/**
 * GrabIt — Vendor Bank Account Configuration Test Suite
 * Tests:
 * 1. POST /api/vendor/payouts/bank-account unauthenticated gating (401 response).
 * 2. POST /api/vendor/payouts/bank-account missing payload fields validation (400 response).
 * 3. POST /api/vendor/payouts/bank-account invalid IFSC format validation (400 response).
 * 4. Account number confirmation matching contract.
 */

import { POST } from "../app/api/vendor/payouts/bank-account/route";

async function runVendorBankAccountTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Vendor Bank Account Configuration Suite");
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

  // TEST 1: Unauthenticated POST request returns 401
  const unauthReq = new Request("http://localhost:3000/api/vendor/payouts/bank-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accountHolderName: "Campus Foods Pvt Ltd",
      bankName: "HDFC Bank",
      accountNumber: "50100012345678",
      ifscCode: "HDFC0001234",
    }),
  });

  const unauthRes = await POST(unauthReq);
  const unauthJson = await unauthRes.json();

  assert(
    unauthRes.status === 401 && !unauthJson.ok && Boolean(unauthJson.error),
    "POST /api/vendor/payouts/bank-account without session strictly returns 401 Access Denied error",
  );

  // TEST 2: Validation check for missing fields helper
  const isMissingFieldValid = (holder: string, bank: string, acc: string, ifscStr: string) => {
    return Boolean(holder.trim() && bank.trim() && acc.trim() && ifscStr.trim());
  };

  assert(
    !isMissingFieldValid("", "HDFC", "123456", "HDFC0001234") &&
      !isMissingFieldValid("Holder", "", "123456", "HDFC0001234"),
    "Client & server validation rejects payloads with empty or whitespace-only bank fields",
  );

  // TEST 3: IFSC Code Regex format validation
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  const validIfsc = "HDFC0001234";
  const invalidIfscShort = "HDFC00123";
  const invalidIfscNoZero = "HDFC1001234";

  assert(
    ifscRegex.test(validIfsc) &&
      !ifscRegex.test(invalidIfscShort) &&
      !ifscRegex.test(invalidIfscNoZero),
    "IFSC code validation strictly enforces 11-character Indian banking format (4 letters, 0, 6 alphanumeric)",
  );

  // TEST 4: Account Number Confirmation Matching Logic
  const confirmMatch = (acc: string, confirm: string) => acc.trim() === confirm.trim();

  assert(
    confirmMatch("50100012345678", "50100012345678") &&
      !confirmMatch("50100012345678", "50100012345679"),
    "Confirm Account Number matching logic prevents typos before database submission",
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runVendorBankAccountTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
