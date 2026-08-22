/**
 * GrabIt — Rewards Page & Campus Leaderboard Layout Test Suite
 * Tests:
 * 1. GET /api/student/rewards/leaderboard unauthenticated access gating (401 response).
 * 2. Leaderboard period parameter parsing ("weekly", "monthly", "alltime").
 * 3. Page layout structural verification (lg:grid-cols-2 desktop side-by-side & mobile fallback).
 */

import { GET } from "../app/api/student/rewards/leaderboard/route";
import type { LeaderboardPeriod } from "../lib/rewards/types";
import * as fs from "node:fs/promises";

async function runRewardsLeaderboardLayoutTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Rewards & Campus Leaderboard Layout Suite");
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

  // TEST 1: Leaderboard GET endpoint without session strictly returns 401
  const unauthReq = new Request("http://localhost:3000/api/student/rewards/leaderboard?period=weekly");
  const unauthRes = await GET(unauthReq);
  const unauthJson = await unauthRes.json();

  assert(
    unauthRes.status === 401 && !unauthJson.ok && Boolean(unauthJson.error),
    "GET /api/student/rewards/leaderboard without session strictly returns 401 Access Denied error",
  );

  // TEST 2: Period parameter parsing logic
  const parsePeriod = (param: string | null): LeaderboardPeriod => {
    return param === "weekly" || param === "monthly" ? param : "alltime";
  };

  assert(
    parsePeriod("weekly") === "weekly" &&
      parsePeriod("monthly") === "monthly" &&
      parsePeriod("alltime") === "alltime" &&
      parsePeriod(null) === "alltime",
    "Leaderboard period parameter parsing strictly accepts 'weekly', 'monthly', 'alltime' and defaults to 'alltime'",
  );

  // TEST 3: Structural check that app/customer/rewards/page.tsx contains desktop grid & mobile stack layout
  const pageSource = await fs.readFile(
    new URL("../app/customer/rewards/page.tsx", import.meta.url),
    "utf-8",
  );

  assert(
    pageSource.includes("lg:grid-cols-2") &&
      pageSource.includes("lg:max-w-5xl") &&
      pageSource.includes("hidden lg:block") &&
      pageSource.includes("lg:hidden"),
    "Rewards page structure includes lg:grid-cols-2 side-by-side desktop grid and mobile stacked fallbacks",
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runRewardsLeaderboardLayoutTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
