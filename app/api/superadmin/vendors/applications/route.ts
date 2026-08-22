import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchVendorApplicationStats,
  fetchVendorApplications,
} from "@/lib/supabase/superadmin_vendor_applications";

/**
 * GET /api/superadmin/vendors/applications
 * Returns live KPI metrics and paginated vendor onboarding applications.
 * Derives Super Admin identity server-side.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const applicationStatus = searchParams.get("applicationStatus") ?? undefined;
  const kycStatus = searchParams.get("kycStatus") ?? undefined;
  const vendorStatus = searchParams.get("vendorStatus") ?? undefined;
  const campusId = searchParams.get("campusId") ?? undefined;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10);

  try {
    const [stats, applicationsResult] = await Promise.all([
      fetchVendorApplicationStats(),
      fetchVendorApplications({
        search,
        applicationStatus,
        kycStatus,
        vendorStatus,
        campusId,
        page,
        pageSize,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      stats,
      applications: applicationsResult.applications,
      totalCount: applicationsResult.totalCount,
      page,
      pageSize,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load vendor applications." },
      { status: 500 },
    );
  }
}
