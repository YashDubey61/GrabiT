import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  getOperationalAlerts,
  syncAndDeduplicateOperationalAlerts,
  type AlertStatus,
  type AlertSeverity,
} from "@/lib/supabase/superadmin_alerts";

export async function GET(request: Request) {
  try {
    // 1. Role Guard: Require authenticated Super Admin session
    const superAdminCtx = await getAuthenticatedSuperAdminContext();
    if (!superAdminCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Super Admin authorization required." },
        { status: 403 },
      );
    }

    // 2. Extract Query Parameters
    const { searchParams } = new URL(request.url);
    const statusParam = (searchParams.get("status") as AlertStatus) || undefined;
    const severityParam = (searchParams.get("severity") as AlertSeverity) || undefined;
    const syncParam = searchParams.get("sync") === "true";

    if (syncParam) {
      const syncedAlerts = await syncAndDeduplicateOperationalAlerts();
      return NextResponse.json({ ok: true, alerts: syncedAlerts });
    }

    const alerts = await getOperationalAlerts(statusParam, severityParam);

    return NextResponse.json({
      ok: true,
      alerts,
    });
  } catch (err) {
    console.error("Super Admin Alerts GET error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error fetching operational alerts." },
      { status: 500 },
    );
  }
}
