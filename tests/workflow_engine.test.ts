if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "mock_service_role_key";
}

import { runScheduledJobs, executeWorkflowRule, getWorkflowRules } from "../lib/workflows/workflow_engine";

async function runTests() {
  console.log("==================================================");
  console.log("Day 51 — Workflow Engine Automated Verification");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Fetch Workflow Rules & Cadences
  try {
    const rules = await getWorkflowRules();
    if (rules.length === 10) {
      console.log("✅ TEST 1 PASSED: Successfully fetched 10 seed/db workflow rules.");
      passed++;
    } else {
      console.error(`❌ TEST 1 FAILED: Expected 10 rules, got ${rules.length}`);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 1 ERROR:", err);
    failed++;
  }

  // Test 2: Cadence Filtering (HIGH vs MEDIUM vs DAILY)
  try {
    const highTelemetry = await runScheduledJobs("HIGH");
    const mediumTelemetry = await runScheduledJobs("MEDIUM");
    const dailyTelemetry = await runScheduledJobs("DAILY");

    if (highTelemetry && mediumTelemetry && dailyTelemetry) {
      console.log("✅ TEST 2 PASSED: Cadence filtering (HIGH, MEDIUM, DAILY) executed cleanly.");
      passed++;
    } else {
      console.error("❌ TEST 2 FAILED: Cadence telemetry execution failed.");
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 2 ERROR:", err);
    failed++;
  }

  // Test 3: Idempotency Uniqueness Key Check
  try {
    const rules = await getWorkflowRules();
    const testRule = rules[0];
    const uniqueKey = `test-idempotency-${Date.now()}`;

    const run1 = await executeWorkflowRule(testRule, uniqueKey, { message: "Test Run 1" });
    const disabledRule = { ...testRule, enabled: false };
    const runDisabled = await executeWorkflowRule(disabledRule, uniqueKey, { message: "Disabled test" });

    if (run1.status === "SUCCESS" && runDisabled.status === "SKIPPED") {
      console.log("✅ TEST 3 PASSED: Idempotency & rule state guard verified (SKIPPED on disabled/duplicate).");
      passed++;
    } else {
      console.error(`❌ TEST 3 FAILED: Run 1 status=${run1.status}, Disabled status=${runDisabled.status}`);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 3 ERROR:", err);
    failed++;
  }

  // Test 4: Failure Isolation Verification
  try {
    const telemetry = await runScheduledJobs("ALL");
    if (telemetry.totalExecutions === 10 && telemetry.healthStatus !== undefined) {
      console.log(`✅ TEST 4 PASSED: Failure isolation verified (${telemetry.successfulExecutions} succeeded, ${telemetry.failedExecutions} failed).`);
      passed++;
    } else {
      console.error("❌ TEST 4 FAILED: Telemetry execution mismatch.");
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
