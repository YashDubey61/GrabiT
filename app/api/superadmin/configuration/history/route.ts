import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { fetchAuditLogs } from "@/lib/supabase/superadmin_audit";

/**
 * GET /api/superadmin/configuration/history
 * Returns the version audit history for a specific platform configuration key from superadmin_audit_logs.
 * Server-authoritative Super Admin access control.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const configKey = searchParams.get("configKey");

  if (!configKey) {
    return NextResponse.json({ ok: false, error: "Missing required query parameter: configKey" }, { status: 400 });
  }

  try {
    const logsResult = await fetchAuditLogs({
      targetId: configKey,
      module: "System",
      pageSize: 50,
    });

    return NextResponse.json({
      ok: true,
      configKey,
      history: logsResult.events,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load configuration history." },
      { status: 500 }
    );
  }
}
