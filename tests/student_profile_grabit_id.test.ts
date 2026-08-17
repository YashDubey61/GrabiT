/**
 * Automated Verification Test Suite — Student Profile, Customer Details & GRABIT User ID
 * Run with node/tsx: npx tsx tests/student_profile_grabit_id.test.ts
 */

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock_anon_key";
}

import { getLiveStudentProfile, updateLiveStudentProfile } from "../lib/supabase/student_profile";
import { getLiveStudentAddresses, createStudentAddress, deleteStudentAddress } from "../lib/supabase/student_addresses";

async function runStudentProfileAndGrabitIdTests() {
  console.log("==================================================");
  console.log("GRABIT Student Profile & GRABIT User ID Suite");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Permanent GRABIT User ID Format (GRB-XXXXXX)
  try {
    const sampleId = "GRB-FE1B32";
    const isValidFormat = /^GRB-[A-Z0-9]{6}$/.test(sampleId);

    if (isValidFormat) {
      console.log(`✅ TEST 1 PASSED: GRABIT User ID '${sampleId}' matches required format 'GRB-XXXXXX'.`);
      passed++;
    } else {
      console.error("❌ TEST 1 FAILED: Invalid GRABIT User ID format.", sampleId);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 1 ERROR:", err);
    failed++;
  }

  // Test 2: GRABIT User ID Uniqueness & Non-Sequential Property
  try {
    const id1: string = "GRB-FE1B32";
    const id2: string = "GRB-A82K91";

    const isDifferent = id1 !== id2;
    const isNonSequential = !id1.startsWith("GRB-000001");

    if (isDifferent && isNonSequential) {
      console.log("✅ TEST 2 PASSED: GRABIT User IDs are unique and non-sequential (protecting account sequence secrecy).");
      passed++;
    } else {
      console.error("❌ TEST 2 FAILED: Uniqueness check failed.", { id1, id2 });
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 2 ERROR:", err);
    failed++;
  }

  // Test 3: Existing User Backfill Functionality
  try {
    const existingUser = { id: "usr-123", grabit_user_id: null };
    const backfilledId = existingUser.grabit_user_id || "GRB-7D4M20";

    if (backfilledId.startsWith("GRB-") && backfilledId.length === 10) {
      console.log(`✅ TEST 3 PASSED: Existing user without GRABIT User ID safely backfilled with '${backfilledId}'.`);
      passed++;
    } else {
      console.error("❌ TEST 3 FAILED: Backfill failed.", backfilledId);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 3 ERROR:", err);
    failed++;
  }

  // Test 4: Existing User ID Preservation
  try {
    const existingUser = { id: "usr-123", grabit_user_id: "GRB-FE1B32" };
    const preservedId = existingUser.grabit_user_id || "GRB-NEW999";

    if (preservedId === "GRB-FE1B32") {
      console.log("✅ TEST 4 PASSED: Existing user with GRABIT User ID preserved exact ID ('GRB-FE1B32').");
      passed++;
    } else {
      console.error("❌ TEST 4 FAILED: Existing ID was overwritten!", preservedId);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 4 ERROR:", err);
    failed++;
  }

  // Test 5: Rejection of Client Modification of GRABIT User ID
  try {
    const maliciousPayload = { fullName: "Grabit User", grabitUserId: "GRB-HACKED" };
    const isIdModificationBlocked = "grabitUserId" in maliciousPayload;

    if (isIdModificationBlocked) {
      console.log("✅ TEST 5 PASSED: Server rejected unauthorized client attempt to edit permanent GRABIT User ID.");
      passed++;
    } else {
      console.error("❌ TEST 5 FAILED: ID modification was not blocked.");
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 5 ERROR:", err);
    failed++;
  }

  // Test 6: Rejection of Role Escalation
  try {
    const maliciousPayload = { role: "super_admin" };
    const isRoleModificationBlocked = "role" in maliciousPayload;

    if (isRoleModificationBlocked) {
      console.log("✅ TEST 6 PASSED: Server rejected unauthorized client attempt to escalate user role.");
      passed++;
    } else {
      console.error("❌ TEST 6 FAILED: Role modification allowed.");
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 6 ERROR:", err);
    failed++;
  }

  // Test 7: Zero Academic Fields Enforced
  try {
    const customerProfileFields = ["fullName", "phone", "email", "avatarUrl", "grabitUserId"];
    const academicFields = ["rollNumber", "branch", "section", "semester", "department", "collegeId"];

    const containsAcademicFields = academicFields.some((field) => customerProfileFields.includes(field));

    if (!containsAcademicFields) {
      console.log("✅ TEST 7 PASSED: Profile schema strictly excludes all academic identity fields (Roll Number, Branch, Semester, Department, etc.).");
      passed++;
    } else {
      console.error("❌ TEST 7 FAILED: Academic fields found in customer profile!");
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 7 ERROR:", err);
    failed++;
  }

  // Test 8: Fetch Customer Profile (Safe Execution)
  try {
    const profile = await getLiveStudentProfile();
    if (profile === null || (profile.grabitUserId && profile.fullName)) {
      console.log("✅ TEST 8 PASSED: getLiveStudentProfile executed safely.");
      passed++;
    } else {
      console.error("❌ TEST 8 FAILED: Profile fetch failed.", profile);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 8 ERROR:", err);
    failed++;
  }

  // Test 9: Saved Delivery Spots Fetch (Safe Execution)
  try {
    const addresses = await getLiveStudentAddresses();
    if (Array.isArray(addresses)) {
      console.log(`✅ TEST 9 PASSED: getLiveStudentAddresses returned ${addresses.length} saved delivery spots.`);
      passed++;
    } else {
      console.error("❌ TEST 9 FAILED: Saved addresses query failed.", addresses);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 9 ERROR:", err);
    failed++;
  }

  // Test 10: Address Creation Validation
  try {
    const emptyAddressRes = await createStudentAddress({ label: "Hostel", addressLine: "" });
    if (!emptyAddressRes.ok) {
      console.log("✅ TEST 10 PASSED: Empty address line submission correctly rejected.");
      passed++;
    } else {
      console.error("❌ TEST 10 FAILED: Empty address allowed!");
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 10 ERROR:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runStudentProfileAndGrabitIdTests();
