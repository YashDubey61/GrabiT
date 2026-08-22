import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { fetchAutomatedIncidentSignals } from "@/lib/supabase/superadmin_incidents";

/**
 * GET /api/superadmin/incidents/signals
 * Returns automated incident signals and anomaly recommendations.
 */
export async function GET() {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  try {
    const signals = await fetchAutomatedIncidentSignals();
    return NextResponse.json({ ok: true, signals });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load incident signals." },
      { status: 500 }
    );
  }
}
