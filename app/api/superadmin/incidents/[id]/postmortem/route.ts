import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { createOrUpdateIncidentPostmortem } from "@/lib/supabase/superadmin_incidents";

/**
 * POST /api/superadmin/incidents/[id]/postmortem
 * Creates or updates an incident postmortem report.
 */
export async function POST(
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
    const result = await createOrUpdateIncidentPostmortem(
      {
        incidentId: id,
        rootCause: body.rootCause,
        impactSummary: body.impactSummary,
        timelineSummary: body.timelineSummary,
        whatWentWell: body.whatWentWell,
        whatWentWrong: body.whatWentWrong,
        correctiveActions: body.correctiveActions,
        preventiveActions: body.preventiveActions,
        status: body.status,
      },
      adminCtx.user.id
    );

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: "Incident postmortem saved successfully.",
      postmortem: result.postmortem,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to save postmortem." },
      { status: 500 }
    );
  }
}
