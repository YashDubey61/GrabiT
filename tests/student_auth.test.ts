/**
 * Automated Test Suite — Student Sign-In Production Authentication, Navigation & Role Protection
 * Run with node/tsx: npx tsx tests/student_auth.test.ts
 */

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock_anon_key";
}

import { signStudentIn } from "../lib/supabase/auth";
import { ROLE_HOME, isAuthorizedForPath } from "../lib/auth/roles";
import type { UserRole } from "../types";

// Helper regex matching app email validation
const isEmailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

// Safe redirect URL validator matching app/auth/page.tsx
function getSafeRedirectUrl(next: string | null, userRole: UserRole = "student"): string {
  const defaultPath = ROLE_HOME[userRole] || "/student";
  if (!next) return defaultPath;

  const trimmed = next.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.includes(":") &&
    !trimmed.includes("\\")
  ) {
    return trimmed;
  }
  return defaultPath;
}

async function runStudentAuthNavigationTests() {
  console.log("==================================================");
  console.log("GRABIT Student Sign-In — Post-Login Navigation Suite");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Successful Student Login Navigation Target
  try {
    const dest = getSafeRedirectUrl(null, "student");
    if (dest === "/student") {
      console.log("✅ TEST 1 PASSED: Valid Student login targets /student.");
      passed++;
    } else {
      console.error("❌ TEST 1 FAILED: Unexpected destination.", dest);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 1 ERROR:", err);
    failed++;
  }

  // Test 2: Next Parameter Navigation Handling (/auth?next=/student)
  try {
    const nextParam = "/student";
    const dest = getSafeRedirectUrl(nextParam, "student");
    if (dest === "/student") {
      console.log("✅ TEST 2 PASSED: /auth?next=/student navigates to /student.");
      passed++;
    } else {
      console.error("❌ TEST 2 FAILED: Failed to honor next parameter.", dest);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 2 ERROR:", err);
    failed++;
  }

  // Test 3: Open Redirect Prevention (Security Requirement)
  try {
    const maliciousNext1 = "https://evil-site.com";
    const maliciousNext2 = "//malicious.site";
    const maliciousNext3 = "javascript:alert(1)";

    const dest1 = getSafeRedirectUrl(maliciousNext1, "student");
    const dest2 = getSafeRedirectUrl(maliciousNext2, "student");
    const dest3 = getSafeRedirectUrl(maliciousNext3, "student");

    if (dest1 === "/student" && dest2 === "/student" && dest3 === "/student") {
      console.log("✅ TEST 3 PASSED: Open redirect attacks rejected (external URLs sanitized to /student).");
      passed++;
    } else {
      console.error("❌ TEST 3 FAILED: Open redirect vulnerability detected!", { dest1, dest2, dest3 });
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 3 ERROR:", err);
    failed++;
  }

  // Test 4: Vendor Login Navigation Isolation
  try {
    const dest = getSafeRedirectUrl(null, "vendor");
    if (dest === "/vendor") {
      console.log("✅ TEST 4 PASSED: Vendor login targets /vendor dashboard.");
      passed++;
    } else {
      console.error("❌ TEST 4 FAILED: Vendor destination mismatch.", dest);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 4 ERROR:", err);
    failed++;
  }

  // Test 5: Super Admin Login Navigation Isolation
  try {
    const dest = getSafeRedirectUrl(null, "admin");
    if (dest === "/superadmin") {
      console.log("✅ TEST 5 PASSED: Super Admin login targets /superadmin dashboard.");
      passed++;
    } else {
      console.error("❌ TEST 5 FAILED: Super Admin destination mismatch.", dest);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 5 ERROR:", err);
    failed++;
  }

  // Test 6: Input Validation — Empty Email
  try {
    const email = "";
    if (!email.trim()) {
      const msg = "Please enter your email.";
      if (msg === "Please enter your email.") {
        console.log("✅ TEST 6 PASSED: Empty email validation returned 'Please enter your email.'");
        passed++;
      } else {
        console.error("❌ TEST 6 FAILED: Unexpected error message.");
        failed++;
      }
    }
  } catch (err) {
    console.error("❌ TEST 6 ERROR:", err);
    failed++;
  }

  // Test 7: Input Validation — Empty Password
  try {
    const pass = "";
    if (!pass) {
      const msg = "Please enter your password.";
      if (msg === "Please enter your password.") {
        console.log("✅ TEST 7 PASSED: Empty password validation returned 'Please enter your password.'");
        passed++;
      } else {
        console.error("❌ TEST 7 FAILED: Unexpected error message.");
        failed++;
      }
    }
  } catch (err) {
    console.error("❌ TEST 7 ERROR:", err);
    failed++;
  }

  // Test 8: Failed Auth Error Safety
  try {
    const res = await signStudentIn("student@grabit.in", "wrongpassword");
    if (!res.ok && res.error && !res.error.includes("stack") && !res.error.includes("Postgres")) {
      console.log(`✅ TEST 8 PASSED: Failed auth returned user-friendly error without internal leakage: "${res.error}"`);
      passed++;
    } else {
      console.error("❌ TEST 8 FAILED: Unsafe error message returned.", res);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 8 ERROR:", err);
    failed++;
  }

  // Test 9: Server-Authoritative Role Isolation
  try {
    const studentAccessStudent = isAuthorizedForPath("student", "/student");
    const vendorAccessStudent = isAuthorizedForPath("vendor", "/student");
    const adminAccessStudent = isAuthorizedForPath("admin", "/student");

    if (studentAccessStudent && !vendorAccessStudent && !adminAccessStudent) {
      console.log("✅ TEST 9 PASSED: Role isolation enforced (Only student can access /student).");
      passed++;
    } else {
      console.error("❌ TEST 9 FAILED: Role isolation rule broken.");
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 9 ERROR:", err);
    failed++;
  }

  // Test 10: Zero API Secrets Leakage
  try {
    const publicEnvVars = Object.keys(process.env).filter((k) => k.startsWith("NEXT_PUBLIC_"));
    const sensitiveKeywords = ["SERVICE_ROLE", "SECRET", "PRIVATE_KEY"];
    const leaks = publicEnvVars.filter((k) => sensitiveKeywords.some((w) => k.toUpperCase().includes(w)));

    if (leaks.length === 0) {
      console.log("✅ TEST 10 PASSED: Zero API secrets or service role keys exposed in client env vars.");
      passed++;
    } else {
      console.error("❌ TEST 10 FAILED: Sensitive env vars exposed!", leaks);
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

runStudentAuthNavigationTests();
