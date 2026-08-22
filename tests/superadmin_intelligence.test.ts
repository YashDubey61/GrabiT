/**
 * GrabIt — Super Admin Platform Intelligence & Advanced Analytics Suite
 * Tests:
 * 1. Role Authorization Gating for /superadmin/intelligence.
 * 2. Executive Overview KPI Aggregation.
 * 3. Deterministic 5-Pillar Platform Health Score.
 * 4. Growth Trajectory Datapoints & Peak Day Highlights.
 * 5. Campus Performance Rankings & Vendor Intelligence.
 * 6. Demand Peaks & Statistical Forecast Fallback.
 * 7. Empirical Actionable Intelligence Insights.
 */

import { isAuthorizedForPath } from "../lib/auth/roles";
import {
  fetchExecutiveOverviewData,
  fetchPlatformHealthScoreData,
  fetchPlatformGrowthAnalytics,
  fetchCampusIntelligenceDirectory,
  fetchVendorAndProductIntelligence,
  fetchDemandAndPredictiveAnalytics,
  fetchActionableInsightsAndAlerts,
} from "../lib/supabase/superadmin_intelligence";

async function runSuperAdminIntelligenceTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Super Admin Platform Intelligence Suite");
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

  // TEST 1: Role Authorization Gating
  const isAdminAllowed = isAuthorizedForPath("admin", "/superadmin/intelligence");
  const isVendorAllowed = isAuthorizedForPath("vendor", "/superadmin/intelligence");
  const isStudentAllowed = isAuthorizedForPath("student", "/superadmin/intelligence");

  assert(
    isAdminAllowed && !isVendorAllowed && !isStudentAllowed,
    "Super Admin path (/superadmin/intelligence) permits Admin role and strictly blocks Vendor & Student roles"
  );

  // TEST 2: Executive Overview KPI Aggregation
  const { stats } = await fetchExecutiveOverviewData("30d");
  assert(
    stats.gmv >= 0 && stats.platformRevenue >= 0 && stats.completionRate > 0,
    "fetchExecutiveOverviewData calculates live executive KPIs and period comparisons"
  );

  // TEST 3: Deterministic 5-Pillar Platform Health Score
  const healthScore = await fetchPlatformHealthScoreData();
  const isScoreValid = healthScore.overallScore >= 0 && healthScore.overallScore <= 100;
  const isPillarsComplete = Boolean(
    healthScore.pillars.operations &&
      healthScore.pillars.payments &&
      healthScore.pillars.customerExperience &&
      healthScore.pillars.vendorHealth &&
      healthScore.pillars.security
  );

  assert(
    isScoreValid && isPillarsComplete,
    "fetchPlatformHealthScoreData calculates explainable 0-100 Platform Health Score across 5 weighted pillars"
  );

  // TEST 4: Growth Trajectory Datapoints
  const growth = await fetchPlatformGrowthAnalytics("30d");
  assert(
    Array.isArray(growth.points) && growth.points.length === 30 && Boolean(growth.peakGmvDay),
    "fetchPlatformGrowthAnalytics calculates historical growth trajectories and peak period highlights"
  );

  // TEST 5: Campus Rankings & Vendor Intelligence
  const campuses = await fetchCampusIntelligenceDirectory();
  const { vendors } = await fetchVendorAndProductIntelligence();
  assert(
    Array.isArray(campuses) && campuses.length > 0 && Array.isArray(vendors) && vendors.length > 0,
    "fetchCampusIntelligenceDirectory & fetchVendorAndProductIntelligence compute performance rankings and categories"
  );

  // TEST 6: Demand Peaks & Statistical Forecast
  const demand = await fetchDemandAndPredictiveAnalytics();
  assert(
    demand.status === "AVAILABLE" && demand.peakHours.length > 0 && demand.forecastedOrdersNextDay > 0,
    "fetchDemandAndPredictiveAnalytics identifies peak ordering windows and statistical demand forecasts"
  );

  // TEST 7: Empirical Actionable Insights
  const insights = await fetchActionableInsightsAndAlerts();
  assert(
    Array.isArray(insights) && insights.length > 0 && Boolean(insights[0].evidence),
    "fetchActionableInsightsAndAlerts generates data-backed actionable executive insights with supporting evidence"
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSuperAdminIntelligenceTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
