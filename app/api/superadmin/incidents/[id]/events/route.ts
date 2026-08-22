import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { addIncidentTimelineEvent } from "@/lib/supabase/superadmin_incidents";

/**
 * POST /api/superadmin/incidents/[id]/events
 * Appends a timeline event or internal note to an incident.
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
    const { eventType, message } = body;

    const result = await addIncidentTimelineEvent(
      id,
      eventType || "NOTE",
      message || "",
      adminCtx.user.id
    );

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: "Timeline event added successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to add timeline event." },
      { status: 500 }
    );
  }
}
