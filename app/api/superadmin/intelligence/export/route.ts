import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchCampusIntelligenceDirectory,
  fetchVendorAndProductIntelligence,
} from "@/lib/supabase/superadmin_intelligence";

/**
 * GET /api/superadmin/intelligence/export
 * Generates a sanitized CSV report of campus & vendor intelligence analytics.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  try {
    const [campuses, { vendors }] = await Promise.all([
      fetchCampusIntelligenceDirectory(),
      fetchVendorAndProductIntelligence(),
    ]);

    const headers = [
      "Campus Name",
      "Rank",
      "Active Students",
      "Active Vendors",
      "Total Orders",
      "Gross GMV (INR)",
      "Net Revenue (INR)",
      "AOV (INR)",
      "Completion Rate (%)",
      "Cancellation Rate (%)",
      "Refund Rate (%)",
      "Avg Rating",
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = campuses.map((c) => [
      escapeCsv(c.campusName),
      escapeCsv(c.rank),
      escapeCsv(c.activeStudents),
      escapeCsv(c.activeVendors),
      escapeCsv(c.ordersCount),
      escapeCsv(c.gmv),
      escapeCsv(c.revenue),
      escapeCsv(c.aov),
      escapeCsv(c.completionRate),
      escapeCsv(c.cancellationRate),
      escapeCsv(c.refundRate),
      escapeCsv(c.avgRating),
    ]);

    const csvString = [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\n");

    const dateSuffix = new Date().toISOString().split("T")[0];
    return new Response(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="grabit_platform_intelligence_${dateSuffix}.csv"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate intelligence export report." },
      { status: 500 }
    );
  }
}
