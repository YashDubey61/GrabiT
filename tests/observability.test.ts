/**
 * Day 54 Automated Verification Test Suite for Production Observability & SLO Engine
 * Run with node/tsx: npx tsx tests/observability.test.ts
 */

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "mock_service_role_key";
}

import {
  calculateSloResult,
  getSystemHealthTelemetry,
  PRODUCTION_SLOS,
} from "../lib/observability/slo_engine";

async function runTests() {
  console.log("==================================================");
  console.log("Day 54 — Production Observability & SLO Engine Automated Verification");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  // Test 1: SLO Calculation & Error Budget Math
  try {
    const meets = calculateSloResult("Core API Availability", 99.5, 99.8);
    const atRisk = calculateSloResult("Core API Availability", 99.5, 99.6);
    const breached = calculateSloResult("Core API Availability", 99.5, 98.2);

    if (
      meets.status === "MEETS_SLO" &&
      atRisk.status === "AT_RISK" &&
      breached.status === "BREACHED" &&
      meets.errorBudgetRemainingPercent === 100
    ) {
      console.log("✅ TEST 1 PASSED: SLO compliance and error budget calculation verified.");
      passed++;
    } else {
      console.error(`❌ TEST 1 FAILED: SLO state mismatch. meets=${meets.status}, atRisk=${atRisk.status}, breached=${breached.status}`);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 1 ERROR:", err);
    failed++;
  }

  // Test 2: Production SLO Target Definitions
  try {
    const keys = Object.keys(PRODUCTION_SLOS);
    if (keys.length === 7 && PRODUCTION_SLOS.CORE_API_AVAILABILITY.targetPercent === 99.5) {
      console.log("✅ TEST 2 PASSED: Verified 7 production SLO target definitions.");
      passed++;
    } else {
      console.error(`❌ TEST 2 FAILED: Expected 7 production SLOs, got ${keys.length}`);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 2 ERROR:", err);
    failed++;
  }

  // Test 3: System Health Telemetry Query & Aggregation Structure
  try {
    const telemetry = await getSystemHealthTelemetry();
    if (telemetry.overallStatus && typeof telemetry.reliabilityScore === "number" && telemetry.sloResults.length > 0) {
      console.log(`✅ TEST 3 PASSED: System health telemetry data structure verified (Score: ${telemetry.reliabilityScore}%, Status: ${telemetry.overallStatus}).`);
      passed++;
    } else {
      console.error("❌ TEST 3 FAILED: System health telemetry data structure mismatch.");
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 3 ERROR:", err);
    failed++;
  }

  // Test 4: Zero-Division Safety & Bounds Check
  try {
    const zeroResult = calculateSloResult("Test SLO", 99.0, 0);
    if (zeroResult.status === "BREACHED" && zeroResult.errorBudgetRemainingPercent === 0) {
      console.log("✅ TEST 4 PASSED: Zero-division and lower bound safety verified.");
      passed++;
    } else {
      console.error("❌ TEST 4 FAILED: Zero bounds safety check failed.", zeroResult);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 4 ERROR:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
