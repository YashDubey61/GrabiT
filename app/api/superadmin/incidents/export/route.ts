import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { fetchIncidentsDirectory } from "@/lib/supabase/superadmin_incidents";

/**
 * GET /api/superadmin/incidents/export
 * Generates a sanitized CSV report of platform incidents.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const severity = searchParams.get("severity") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  try {
    const { incidents } = await fetchIncidentsDirectory(severity, status, search);

    const headers = [
      "Incident Number",
      "Title",
      "Severity",
      "Status",
      "Category",
      "Affected Service",
      "Detected At",
      "Acknowledged At",
      "Mitigated At",
      "Resolved At",
      "Closed At",
      "Affected Users",
      "Affected Orders",
      "Affected Payments",
      "Estimated Revenue Impact (INR)",
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = incidents.map((i) => [
      escapeCsv(i.incidentNumber),
      escapeCsv(i.title),
      escapeCsv(i.severity),
      escapeCsv(i.status),
      escapeCsv(i.category),
      escapeCsv(i.affectedService),
      escapeCsv(i.detectedAt),
      escapeCsv(i.acknowledgedAt || "N/A"),
      escapeCsv(i.mitigatedAt || "N/A"),
      escapeCsv(i.resolvedAt || "N/A"),
      escapeCsv(i.closedAt || "N/A"),
      escapeCsv(i.affectedUserCount),
      escapeCsv(i.affectedOrderCount),
      escapeCsv(i.affectedPaymentCount),
      escapeCsv(i.estimatedRevenueImpact),
    ]);

    const csvString = [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\n");

    const dateSuffix = new Date().toISOString().split("T")[0];
    return new Response(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="grabit_incidents_report_${dateSuffix}.csv"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate incident export report." },
      { status: 500 }
    );
  }
}
