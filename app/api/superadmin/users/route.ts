import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchUserManagementStats,
  fetchUserDirectory,
} from "@/lib/supabase/superadmin_users";

/**
 * GET /api/superadmin/users
 * Returns aggregate user metrics and paginated, filtered user directory.
 * Super Admin authentication derived strictly server-side.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const role = searchParams.get("role") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const campusId = searchParams.get("campusId") ?? undefined;
  const canteenId = searchParams.get("canteenId") ?? undefined;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10);

  try {
    const directoryResult = await fetchUserDirectory({
      search,
      role,
      status,
      campusId,
      canteenId,
      page,
      pageSize,
    });

    return NextResponse.json({
      ok: true,
      stats: directoryResult.stats,
      users: directoryResult.users,
      totalCount: directoryResult.totalCount,
      page,
      pageSize,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to retrieve user directory." },
      { status: 500 },
    );
  }
}
