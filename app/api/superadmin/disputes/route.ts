import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchDisputeOverviewStats,
  fetchDisputes,
} from "@/lib/supabase/superadmin_disputes";

/**
 * GET /api/superadmin/disputes
 * Returns live Dispute & Refund KPI metrics and paginated disputes directory.
 * Server-derived Super Admin authorization.
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
  const campusId = searchParams.get("campusId") ?? undefined;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10);

  try {
    const [stats, disputesResult] = await Promise.all([
      fetchDisputeOverviewStats(),
      fetchDisputes({
        search,
        status,
        priority,
        disputeType,
        refundStatus,
        campusId,
        page,
        pageSize,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      stats,
      disputes: disputesResult.disputes,
      totalCount: disputesResult.totalCount,
      page,
      pageSize,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load dispute center data." },
      { status: 500 },
    );
  }
}
