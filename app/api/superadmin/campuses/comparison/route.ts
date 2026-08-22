import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { fetchCampusComparisonMetrics } from "@/lib/supabase/superadmin_campuses";

/**
 * GET /api/superadmin/campuses/comparison
 * Returns comparative metrics across all campuses.
 */
export async function GET() {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  try {
    const comparisonList = await fetchCampusComparisonMetrics();

    return NextResponse.json({
      ok: true,
      comparison: comparisonList,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load campus comparison." },
      { status: 500 }
    );
  }
}
