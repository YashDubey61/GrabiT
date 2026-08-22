import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchIncidentOverviewData,
  fetchIncidentsDirectory,
  createSuperAdminIncident,
} from "@/lib/supabase/superadmin_incidents";

/**
 * GET /api/superadmin/incidents
 * Returns Incident Overview KPIs and Incident Directory.
 * Server-authoritative Super Admin role guard.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const severity = searchParams.get("severity") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") || searchParams.get("q") || undefined;

  try {
    const [stats, directory] = await Promise.all([
      fetchIncidentOverviewData(),
      fetchIncidentsDirectory(severity, status, search),
    ]);

    return NextResponse.json({
      ok: true,
      stats,
      incidents: directory.incidents,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load incident directory." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/incidents
 * Creates a new platform operational incident.
 */
export async function POST(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const result = await createSuperAdminIncident(body, adminCtx.user.id);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: `Incident ${result.incident?.incidentNumber} created successfully.`,
      incident: result.incident,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to create incident." },
      { status: 500 }
    );
  }
}
