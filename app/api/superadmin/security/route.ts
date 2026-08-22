import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchSecurityOverviewData,
  fetchSecurityEventsDirectory,
} from "@/lib/supabase/superadmin_security";

/**
 * GET /api/superadmin/security
 * Returns Overview KPIs, Explainable Security Score, Posture Metrics, and Security Events Directory.
 * Server-authoritative Super Admin role guard.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const severity = searchParams.get("severity") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("search") || searchParams.get("q") || undefined;

  try {
    const [{ stats, posture }, events] = await Promise.all([
      fetchSecurityOverviewData(),
      fetchSecurityEventsDirectory(severity, category, search),
    ]);

    return NextResponse.json({
      ok: true,
      stats,
      posture,
      events,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load security monitoring data." },
      { status: 500 }
    );
  }
}
