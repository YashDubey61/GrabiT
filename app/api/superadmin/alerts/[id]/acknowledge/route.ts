import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { acknowledgeOperationalAlert } from "@/lib/supabase/superadmin_alerts";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Role Guard & Server Identity Resolution: Require authenticated Super Admin session
    const superAdminCtx = await getAuthenticatedSuperAdminContext();
    if (!superAdminCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Super Admin authorization required." },
        { status: 403 },
      );
    }

    const { id: alertId } = await params;
    if (!alertId) {
      return NextResponse.json(
        { ok: false, error: "Alert ID parameter is required." },
        { status: 400 },
      );
    }

    // 2. Acknowledge Alert using server-derived admin user ID
    const result = await acknowledgeOperationalAlert(alertId, superAdminCtx.user.id);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error ?? "Failed to acknowledge alert." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Operational alert acknowledged successfully.",
    });
  } catch (err) {
    console.error("Acknowledge alert API error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error acknowledging alert." },
      { status: 500 },
    );
  }
}
