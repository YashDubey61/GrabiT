import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchFinancialOverviewData,
  fetchVendorFinancialDirectory,
} from "@/lib/supabase/superadmin_finance";

/**
 * GET /api/superadmin/finance/export
 * Generates a sanitized CSV report of financial performance and vendor financial directory.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get("timeframe") || "30d";

  try {
    const [overview, vendors] = await Promise.all([
      fetchFinancialOverviewData(timeframe),
      fetchVendorFinancialDirectory(),
    ]);

    const headers = [
      "Canteen Name",
      "Campus Name",
      "Total Orders",
      "Gross GMV (INR)",
      "Discounts (INR)",
      "Refunds (INR)",
      "Commission Rate (%)",
      "Net Commission (INR)",
      "Net Vendor Earnings (INR)",
      "Pending Settlement (INR)",
      "Paid Out (INR)",
      "Settlement Status",
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = vendors.map((v) => [
      escapeCsv(v.canteenName),
      escapeCsv(v.campusName),
      escapeCsv(v.totalOrders),
      escapeCsv(v.gmv),
      escapeCsv(v.discounts),
      escapeCsv(v.refunds),
      escapeCsv(overview.flow.configuredCommissionPct),
      escapeCsv(v.commission),
      escapeCsv(v.netEarnings),
      escapeCsv(v.pendingSettlement),
      escapeCsv(v.paidOut),
      escapeCsv(v.settlementStatus),
    ]);

    const csvString = [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\n");

    const dateSuffix = new Date().toISOString().split("T")[0];
    return new Response(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="grabit_financial_report_${dateSuffix}.csv"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate financial report." },
      { status: 500 }
    );
  }
}
