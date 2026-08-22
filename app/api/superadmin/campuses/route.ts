import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchSuperAdminCampusesDirectory,
  createLiveCampus,
} from "@/lib/supabase/superadmin_campuses";

/**
 * GET /api/superadmin/campuses
 * Returns Overview KPI stats and Campus directory list.
 * Server-authoritative Super Admin role guard.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || searchParams.get("search") || "";
  const status = searchParams.get("status") || "ALL";

  try {
    const { stats, campuses } = await fetchSuperAdminCampusesDirectory(q, status);

    return NextResponse.json({
      ok: true,
      stats,
      campuses,
      data: {
        campuses,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load campus directory." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/campuses
 * Onboards a new campus with Super Admin authentication.
 */
export async function POST(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { name, location, status, logisticsLeadName } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ ok: false, error: "Campus name is required." }, { status: 400 });
    }

    if (!location || typeof location !== "string" || !location.trim()) {
      return NextResponse.json({ ok: false, error: "Location / City is required." }, { status: 400 });
    }

    const createdCampus = await createLiveCampus({
      name,
      location,
      status: status || "ACTIVE",
      logisticsLeadName,
    });

    return NextResponse.json({
      ok: true,
      campus: createdCampus,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to create campus." },
      { status: 500 }
    );
  }
}
