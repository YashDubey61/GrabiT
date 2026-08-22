import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchSuperAdminCampusDetail,
  updateCampusOperationalStatus,
} from "@/lib/supabase/superadmin_campuses";

/**
 * GET /api/superadmin/campuses/[id]
 * Returns comprehensive details for a single campus.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Campus ID is required." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get("timeframe") || "30d";

  try {
    const campusDetail = await fetchSuperAdminCampusDetail(id, timeframe);

    if (!campusDetail) {
      return NextResponse.json({ ok: false, error: `Campus ID '${id}' not found.` }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      data: campusDetail,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load campus detail." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/superadmin/campuses/[id]
 * Updates campus information or operational status with audit trail.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Campus ID is required." }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { status, reason } = body;

    if (status) {
      const result = await updateCampusOperationalStatus({
        adminId: adminCtx.user.id,
        campusId: id,
        newStatus: status,
        reason,
      });

      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ ok: true, campus: result.campus });
    }

    return NextResponse.json({ ok: false, error: "No valid updates provided." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to update campus." },
      { status: 500 }
    );
  }
}
