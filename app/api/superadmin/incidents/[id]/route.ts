import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchIncidentDetail,
  updateIncidentStatusAndSeverity,
} from "@/lib/supabase/superadmin_incidents";

/**
 * GET /api/superadmin/incidents/[id]
 * Returns single incident details, timeline events, and postmortem report.
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

  try {
    const detail = await fetchIncidentDetail(id);
    if (!detail.incident) {
      return NextResponse.json({ ok: false, error: "Incident not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      incident: detail.incident,
      events: detail.events,
      postmortem: detail.postmortem,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load incident detail." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/superadmin/incidents/[id]
 * Updates incident status, severity, resolution, or internal notes.
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

  try {
    const body = await request.json().catch(() => ({}));
    const result = await updateIncidentStatusAndSeverity(
      {
        incidentId: id,
        status: body.status,
        severity: body.severity,
        resolution: body.resolution,
        internalNotes: body.internalNotes,
        incidentCommanderId: body.incidentCommanderId,
      },
      adminCtx.user.id
    );

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: `Incident updated successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to update incident." },
      { status: 500 }
    );
  }
}
