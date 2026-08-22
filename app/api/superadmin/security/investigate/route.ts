import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { updateSecurityInvestigation } from "@/lib/supabase/superadmin_security";

/**
 * POST /api/superadmin/security/investigate
 * Updates investigation status and notes for a security alert/event.
 */
export async function POST(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { eventId, status, notes, resolutionReason } = body;

    if (!eventId || !status) {
      return NextResponse.json(
        { ok: false, error: "Event ID and status are required." },
        { status: 400 }
      );
    }

    const result = await updateSecurityInvestigation({
      adminId: adminCtx.user.id,
      eventId,
      status,
      notes,
      resolutionReason,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: `Security event investigation status updated to ${status}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to update security investigation." },
      { status: 500 }
    );
  }
}
