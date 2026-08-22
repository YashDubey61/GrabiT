import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { generateDisputeReportCsv } from "@/lib/supabase/superadmin_disputes";

/**
 * GET /api/superadmin/disputes/export
 * Downloads aggregated Dispute & Refund Report CSV without customer PII or payment credentials.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const disputeType = searchParams.get("disputeType") ?? undefined;
  const refundStatus = searchParams.get("refundStatus") ?? undefined;

  try {
    const csvContent = await generateDisputeReportCsv({
      search,
      status,
      priority,
      disputeType,
      refundStatus,
      page: 1,
      pageSize: 1000,
    });

    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `GRABIT_Dispute_Report_${dateStr}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate dispute report export." },
      { status: 500 },
    );
  }
}
