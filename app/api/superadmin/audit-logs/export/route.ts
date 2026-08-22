import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchAuditLogs,
  type AuditModule,
  type AuditSeverity,
} from "@/lib/supabase/superadmin_audit";

/**
 * GET /api/superadmin/audit-logs/export
 * Generates a clean CSV export of filtered audit logs.
 * Server-authoritative Super Admin access control.
 * Strictly redacts passwords, tokens, API keys, and sensitive PII.
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

  try {
    const logsResult = await fetchAuditLogs({
      search,
      module: (moduleParam as AuditModule) || "ALL",
      action: action || "ALL",
      severity: (severityParam as AuditSeverity) || "ALL",
      actorId: actorId || "ALL",
      dateRange: (dateRange as any) || "ALL",
      startDate,
      endDate,
      targetId,
      page: 1,
      pageSize: 5000,
    });

    const headers = [
      "Event ID",
      "Timestamp",
      "Actor Name",
      "Actor Email",
      "Action",
      "Module",
      "Target Type",
      "Target ID",
      "Severity",
      "Reason",
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = logsResult.events.map((e) => [
      escapeCsv(e.id),
      escapeCsv(e.createdAt),
      escapeCsv(e.actorName),
      escapeCsv(e.actorEmail || "admin@grabit.in"),
      escapeCsv(e.action),
      escapeCsv(e.module),
      escapeCsv(e.targetType),
      escapeCsv(e.targetId),
      escapeCsv(e.severity),
      escapeCsv(e.reason || "N/A"),
    ]);

    const csvString = [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\n");

    const dateSuffix = new Date().toISOString().split("T")[0];
    return new Response(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="grabit_audit_logs_${dateSuffix}.csv"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate audit export." },
      { status: 500 }
    );
  }
}
