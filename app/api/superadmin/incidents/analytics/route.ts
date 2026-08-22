import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { fetchIncidentOverviewData } from "@/lib/supabase/superadmin_incidents";

/**
 * GET /api/superadmin/incidents/analytics
 * Returns MTTA, MTTR, and incident analytics breakdown.
 */
export async function GET() {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  try {
    const stats = await fetchIncidentOverviewData();
    return NextResponse.json({
      ok: true,
      analytics: {
        mttaMinutes: stats.avgMttaMinutes,
        mttrMinutes: stats.avgMttrMinutes,
        activeIncidents: stats.activeIncidents,
        sev1Count: stats.sev1Count,
        sev2Count: stats.sev2Count,
        resolvedTodayCount: stats.resolvedTodayCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load incident analytics." },
      { status: 500 }
    );
  }
}
