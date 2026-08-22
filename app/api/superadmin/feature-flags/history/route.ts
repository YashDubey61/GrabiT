import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { fetchAuditLogs } from "@/lib/supabase/superadmin_audit";

/**
 * GET /api/superadmin/feature-flags/history
 * Returns the version audit history for a feature flag key from superadmin_audit_logs.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const flagKey = searchParams.get("flagKey");

  if (!flagKey) {
    return NextResponse.json({ ok: false, error: "Missing required query parameter: flagKey" }, { status: 400 });
  }

  try {
    const logsResult = await fetchAuditLogs({
      targetId: flagKey,
      module: "System",
      pageSize: 50,
    });

    return NextResponse.json({
      ok: true,
      flagKey,
      history: logsResult.events,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load feature flag history." },
      { status: 500 }
    );
  }
}
