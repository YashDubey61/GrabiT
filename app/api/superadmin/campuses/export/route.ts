import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { fetchSuperAdminCampusesDirectory } from "@/lib/supabase/superadmin_campuses";

/**
 * GET /api/superadmin/campuses/export
 * Generates a CSV report of campus operations without student PII.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "ALL";

  try {
    const { campuses } = await fetchSuperAdminCampusesDirectory(q, status);

    const headers = [
      "Campus Name",
      "Campus ID",
      "City / Location",
      "Status",
      "Total Students",
      "Total Vendors",
      "Active Vendors",
      "Today's Orders",
      "Today's GMV (INR)",
      "Logistics Lead",
      "Created Date",
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = campuses.map((c) => [
      escapeCsv(c.name),
      escapeCsv(c.id),
      escapeCsv(c.location),
      escapeCsv(c.status),
      escapeCsv(c.studentsCount),
      escapeCsv(c.vendorsCount),
      escapeCsv(c.activeVendorsCount),
      escapeCsv(c.todaysOrders),
      escapeCsv(c.todaysGmv),
      escapeCsv(c.logisticsLeadName || "Operations Lead"),
      escapeCsv(c.createdAt),
    ]);

    const csvString = [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\n");

    const dateSuffix = new Date().toISOString().split("T")[0];
    return new Response(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="grabit_campus_report_${dateSuffix}.csv"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate campus report." },
      { status: 500 }
    );
  }
}
