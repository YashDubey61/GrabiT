import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { fetchSecurityEventsDirectory } from "@/lib/supabase/superadmin_security";

/**
 * GET /api/superadmin/security/export
 * Generates a CSV report of security events with masked sensitive metadata.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const severity = searchParams.get("severity") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const events = await fetchSecurityEventsDirectory(severity, category, search);

    const headers = [
      "Event ID",
      "Timestamp",
      "Severity",
      "Category",
      "Event Type",
      "Actor Name",
      "Actor Role",
      "Target ID",
      "Module",
      "IP Address",
      "Investigation Status",
      "Reason",
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = events.map((e) => [
      escapeCsv(e.id),
      escapeCsv(e.timestamp),
      escapeCsv(e.severity),
      escapeCsv(e.category),
      escapeCsv(e.eventType),
      escapeCsv(e.actorName),
      escapeCsv(e.actorRole),
      escapeCsv(e.targetId || "N/A"),
      escapeCsv(e.module),
      escapeCsv(e.ipAddress || "N/A"),
      escapeCsv(e.investigationStatus),
      escapeCsv(e.reason || "N/A"),
    ]);

    const csvString = [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\n");

    const dateSuffix = new Date().toISOString().split("T")[0];
    return new Response(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="grabit_security_events_${dateSuffix}.csv"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate security report." },
      { status: 500 }
    );
  }
}
