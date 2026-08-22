import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchFinancialOverviewData,
  fetchRevenueAnalyticsChart,
  fetchVendorFinancialDirectory,
  fetchFinancialAnomaliesAndReconciliation,
} from "@/lib/supabase/superadmin_finance";

/**
 * GET /api/superadmin/finance
 * Centralized Financial Command Center API endpoint.
 * Server-authoritative Super Admin role guard.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get("timeframe") || "30d";
  const search = searchParams.get("search") || searchParams.get("q") || undefined;
  const campusId = searchParams.get("campusId") || undefined;
  const status = searchParams.get("status") || undefined;

  try {
    const [overview, analytics, vendorDirectory, anomaliesAndRec] = await Promise.all([
      fetchFinancialOverviewData(timeframe),
      fetchRevenueAnalyticsChart(timeframe),
      fetchVendorFinancialDirectory(search, campusId, status),
      fetchFinancialAnomaliesAndReconciliation(),
    ]);

    return NextResponse.json({
      ok: true,
      timeframe,
      stats: overview.stats,
      flow: overview.flow,
      analytics,
      vendorDirectory,
      anomalies: anomaliesAndRec.anomalies,
      reconciliation: anomaliesAndRec.reconciliation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load financial command telemetry." },
      { status: 500 }
    );
  }
}
