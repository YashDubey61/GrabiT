/**
 * Day 53 Automated Verification Test Suite for SLA Escalation Engine
 * Run with node/tsx: npx tsx tests/sla_engine.test.ts
 */

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "mock_service_role_key";
}

import {
  evaluateIncidentSLAState,
  validateLifecycleTransition,
  calculateResponseAnalytics,
  evaluateAllOpenIncidentSLAs,
  getOnCallDashboardData,
} from "../lib/incidents/sla_engine";

async function runTests() {
  console.log("==================================================");
  console.log("Day 53 — SLA Escalation Engine Automated Verification");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  // Test 1: SLA Threshold Calculation Helper (ON_TRACK, AT_RISK, BREACHED, RESOLVED)
  try {
    const now = Date.now();
    const created30mAgo = new Date(now - 30 * 60 * 1000).toISOString();
    const dueIn30m = new Date(now + 30 * 60 * 1000).toISOString(); // 50% remaining -> AT_RISK
    const dueIn60m = new Date(now + 60 * 60 * 1000).toISOString(); // > 50% remaining -> ON_TRACK
    const due10mAgo = new Date(now - 10 * 60 * 1000).toISOString(); // BREACHED

    const atRisk = evaluateIncidentSLAState(created30mAgo, dueIn30m, "OPEN");
    const onTrack = evaluateIncidentSLAState(created30mAgo, dueIn60m, "OPEN");
    const breached = evaluateIncidentSLAState(created30mAgo, due10mAgo, "OPEN");
    const resolved = evaluateIncidentSLAState(created30mAgo, due10mAgo, "RESOLVED");

    if (atRisk === "AT_RISK" && onTrack === "ON_TRACK" && breached === "BREACHED" && resolved === "RESOLVED") {
      console.log("✅ TEST 1 PASSED: SLA threshold state calculation (ON_TRACK, AT_RISK, BREACHED, RESOLVED).");
      passed++;
    } else {
      console.error(`❌ TEST 1 FAILED: State mismatch. atRisk=${atRisk}, onTrack=${onTrack}, breached=${breached}, resolved=${resolved}`);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 1 ERROR:", err);
    failed++;
  }

  // Test 2: Server-Side Lifecycle State Machine Guard
  try {
    const valid1 = validateLifecycleTransition("OPEN", "ACKNOWLEDGED");
    const valid2 = validateLifecycleTransition("ACKNOWLEDGED", "RESOLVED");
    const invalid1 = validateLifecycleTransition("OPEN", "CLOSED");
    const invalid2 = validateLifecycleTransition("CLOSED", "OPEN");

    if (valid1.valid && valid2.valid && !invalid1.valid && !invalid2.valid) {
      console.log("✅ TEST 2 PASSED: Server-side lifecycle state machine validated (illegal transitions rejected).");
      passed++;
    } else {
      console.error(`❌ TEST 2 FAILED: Lifecycle guard mismatch. valid1=${valid1.valid}, invalid1=${invalid1.valid}`);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 2 ERROR:", err);
    failed++;
  }

  // Test 3: Response Analytics Zero-Division Safety
  try {
    const analyticsEmpty = calculateResponseAnalytics([]);
    if (
      analyticsEmpty.avgAckTimeMinutes === "N/A" &&
      analyticsEmpty.avgResolutionTimeMinutes === "N/A" &&
      analyticsEmpty.totalEvaluated === 0
    ) {
      console.log("✅ TEST 3 PASSED: Response time analytics zero-division safety verified.");
      passed++;
    } else {
      console.error("❌ TEST 3 FAILED: Analytics math mismatch.", analyticsEmpty);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 3 ERROR:", err);
    failed++;
  }

  // Test 4: On-Call Dashboard Data Structure
  try {
    const dashboardData = await getOnCallDashboardData();
    if (dashboardData.onCallStatus && dashboardData.incidents.length > 0) {
      console.log(`✅ TEST 4 PASSED: On-Call Operations dashboard data structure verified (Status: ${dashboardData.onCallStatus}).`);
      passed++;
    } else {
      console.error("❌ TEST 4 FAILED: Dashboard telemetry missing.");
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 4 ERROR:", err);
    failed++;
  }

  // Test 5: Automated SLA Evaluation Job Execution
  try {
    const cronResult = await evaluateAllOpenIncidentSLAs();
    if (cronResult.status === "ok" && typeof cronResult.evaluated === "number") {
      console.log(`✅ TEST 5 PASSED: Automated SLA evaluation job executed cleanly (Evaluated: ${cronResult.evaluated}).`);
      passed++;
    } else {
      console.error("❌ TEST 5 FAILED: Cron SLA evaluation error.");
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 5 ERROR:", err);
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
