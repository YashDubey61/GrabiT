import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchRiskOverviewStats,
  fetchRiskCases,
} from "@/lib/supabase/superadmin_risk";

/**
 * GET /api/superadmin/risk
 * Returns live KPI risk stats, dashboard trends, and paginated risk cases.
 * Server-derived Super Admin authorization.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const riskLevel = searchParams.get("riskLevel") ?? undefined;
  const caseStatus = searchParams.get("caseStatus") ?? undefined;
  const entityType = searchParams.get("entityType") ?? undefined;
  const campusId = searchParams.get("campusId") ?? undefined;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10);

  try {
    const [stats, casesResult] = await Promise.all([
      fetchRiskOverviewStats(),
      fetchRiskCases({
        search,
        riskLevel,
        caseStatus,
        entityType,
        campusId,
        page,
        pageSize,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      stats,
      cases: casesResult.cases,
      totalCount: casesResult.totalCount,
      page,
      pageSize,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load risk center data." },
      { status: 500 },
    );
  }
}
