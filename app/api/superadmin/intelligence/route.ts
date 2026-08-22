import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchExecutiveOverviewData,
  fetchPlatformHealthScoreData,
  fetchPlatformGrowthAnalytics,
  fetchCampusIntelligenceDirectory,
  fetchVendorAndProductIntelligence,
  fetchDemandAndPredictiveAnalytics,
  fetchActionableInsightsAndAlerts,
} from "@/lib/supabase/superadmin_intelligence";

/**
 * GET /api/superadmin/intelligence
 * Centralized Executive Intelligence & Advanced Analytics API endpoint.
 * Server-authoritative Super Admin role guard.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get("timeframe") || "30d";

  try {
    const [
      overview,
      healthScore,
      growth,
      campuses,
      vendorAndProduct,
      demand,
      insights,
    ] = await Promise.all([
      fetchExecutiveOverviewData(timeframe),
      fetchPlatformHealthScoreData(),
      fetchPlatformGrowthAnalytics(timeframe),
      fetchCampusIntelligenceDirectory(),
      fetchVendorAndProductIntelligence(),
      fetchDemandAndPredictiveAnalytics(),
      fetchActionableInsightsAndAlerts(),
    ]);

    return NextResponse.json({
      ok: true,
      timeframe,
      stats: overview.stats,
      healthScore,
      growth,
      campuses,
      vendors: vendorAndProduct.vendors,
      products: vendorAndProduct.products,
      demand,
      insights,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load platform intelligence telemetry." },
      { status: 500 }
    );
  }
}
