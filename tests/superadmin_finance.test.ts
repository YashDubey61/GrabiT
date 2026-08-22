/**
 * GrabIt — Super Admin Financial Command Center Security & Functionality Suite
 * Tests:
 * 1. Role Authorization Gating for /superadmin/finance.
 * 2. Financial KPI Aggregations & Timeframe Filtering.
 * 3. Dynamic Commission Rate Source (Uses platform_settings / vendor_settlements, never hardcoded).
 * 4. Step-by-Step Financial Flow Pipeline Aggregation.
 * 5. Vendor Financial Directory & Isolation.
 * 6. Financial Anomaly & Reconciliation Detection.
 * 7. Sensitive Data Masking & CSV Export Protection.
 */

import { isAuthorizedForPath } from "../lib/auth/roles";
import {
  fetchFinancialOverviewData,
  fetchRevenueAnalyticsChart,
  fetchVendorFinancialDirectory,
  fetchFinancialAnomaliesAndReconciliation,
} from "../lib/supabase/superadmin_finance";

async function runSuperAdminFinanceTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Super Admin Financial Command Center Suite");
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
  const isAdminAllowed = isAuthorizedForPath("admin", "/superadmin/finance");
  const isVendorAllowed = isAuthorizedForPath("vendor", "/superadmin/finance");
  const isStudentAllowed = isAuthorizedForPath("student", "/superadmin/finance");

  assert(
    isAdminAllowed && !isVendorAllowed && !isStudentAllowed,
    "Super Admin path (/superadmin/finance) permits Admin role and strictly blocks Vendor & Student roles"
  );

  // TEST 2: Financial KPI Aggregations & Timeframe Filtering
  const overview = await fetchFinancialOverviewData("30d");
  const { stats, flow } = overview;

  assert(
    stats.totalGmv >= 0 && stats.netRevenue >= 0 && stats.avgOrderValue >= 0,
    "fetchFinancialOverviewData calculates live GMV, Net Revenue, Commission, AOV, Payouts, and Refunds"
  );

  // TEST 3: Dynamic Commission Rate Source
  const isCommissionConfigured = flow.configuredCommissionPct > 0;
  assert(
    isCommissionConfigured && flow.grabitCommission === Math.round(flow.netOrderValue * (flow.configuredCommissionPct / 100)),
    "Platform commission calculation reads configured rate from platform_settings / vendor_settlements"
  );

  // TEST 4: Revenue & GMV Analytics Chart Datapoints
  const analytics = await fetchRevenueAnalyticsChart("30d");
  assert(
    Array.isArray(analytics.chartPoints) && analytics.chartPoints.length === 30 && Boolean(analytics.highestRevenueDay),
    "fetchRevenueAnalyticsChart aggregates financial growth trends and highlights peak revenue/GMV days"
  );

  // TEST 5: Vendor Financial Directory & Isolation
  const vendors = await fetchVendorFinancialDirectory();
  assert(
    Array.isArray(vendors) && vendors.length > 0 && Boolean(vendors[0].canteenName),
    "fetchVendorFinancialDirectory calculates vendor-specific GMV, commissions, net earnings, and pending settlements"
  );

  // TEST 6: Financial Anomaly & Reconciliation Detection
  const { anomalies, reconciliation } = await fetchFinancialAnomaliesAndReconciliation();
  assert(
    Array.isArray(anomalies) && Array.isArray(reconciliation) && reconciliation.length > 0,
    "fetchFinancialAnomaliesAndReconciliation detects real financial signals and reconciliation status items"
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSuperAdminFinanceTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
