import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { generateRiskReportCsv } from "@/lib/supabase/superadmin_risk";

/**
 * GET /api/superadmin/risk/export
 * Downloads aggregated Risk Report CSV without sensitive customer PII.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const riskLevel = searchParams.get("riskLevel") ?? undefined;
  const caseStatus = searchParams.get("caseStatus") ?? undefined;
  const entityType = searchParams.get("entityType") ?? undefined;

  try {
    const csvContent = await generateRiskReportCsv({
      search,
      riskLevel,
      caseStatus,
      entityType,
      page: 1,
      pageSize: 1000,
    });

    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `GRABIT_Risk_Report_${dateStr}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate risk report export." },
      { status: 500 },
    );
  }
}
