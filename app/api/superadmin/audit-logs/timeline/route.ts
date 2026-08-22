import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { fetchEntityTimeline } from "@/lib/supabase/superadmin_audit";

/**
 * GET /api/superadmin/audit-logs/timeline
 * Returns entity-specific chronological activity timeline.
 * Server-derived Super Admin authorization.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType") || "USER";
  const entityId = searchParams.get("entityId");

  if (!entityId) {
    return NextResponse.json({ ok: false, error: "Missing required query parameter: entityId" }, { status: 400 });
  }

  try {
    const events = await fetchEntityTimeline(entityType, entityId);
    return NextResponse.json({
      ok: true,
      entityType,
      entityId,
      events,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load activity timeline." },
      { status: 500 }
    );
  }
}
