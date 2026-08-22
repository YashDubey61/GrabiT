import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchAuditLogs,
  fetchAuditOverviewStats,
  type AuditModule,
  type AuditSeverity,
} from "@/lib/supabase/superadmin_audit";

/**
 * GET /api/superadmin/audit-logs
 * Returns live Audit Overview KPI stats and paginated audit events.
 * Server-authoritative Super Admin access control via getAuthenticatedSuperAdminContext().
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const moduleParam = searchParams.get("module") ?? undefined;
  const action = searchParams.get("action") ?? undefined;
  const severityParam = searchParams.get("severity") ?? undefined;
  const actorId = searchParams.get("actorId") ?? undefined;
  const dateRange = searchParams.get("dateRange") ?? undefined;
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;
  const targetId = searchParams.get("targetId") ?? undefined;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10);

  try {
    const [stats, logsResult] = await Promise.all([
      fetchAuditOverviewStats(),
      fetchAuditLogs({
        search,
        module: (moduleParam as AuditModule) || "ALL",
        action: action || "ALL",
        severity: (severityParam as AuditSeverity) || "ALL",
        actorId: actorId || "ALL",
        dateRange: (dateRange as any) || "ALL",
        startDate,
        endDate,
        targetId,
        page,
        pageSize,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      stats,
      events: logsResult.events,
      totalCount: logsResult.totalCount,
      page,
      pageSize,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load audit logs data." },
      { status: 500 }
    );
  }
}
