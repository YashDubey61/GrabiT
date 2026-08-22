import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { rollbackFeatureFlag } from "@/lib/supabase/superadmin_feature_flags";

/**
 * POST /api/superadmin/feature-flags/rollback
 * Restores a feature flag to a historical configuration snapshot.
 * Creates a NEW feature_flag_updated audit log without mutating past audit events.
 */
export async function POST(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      flagKey?: string;
      targetState?: any;
      reason?: string;
    };

    if (!body.flagKey) {
      return NextResponse.json({ ok: false, error: "Missing required parameter: flagKey" }, { status: 400 });
    }

    if (!body.targetState) {
      return NextResponse.json({ ok: false, error: "Missing required parameter: targetState" }, { status: 400 });
    }

    if (!body.reason?.trim()) {
      return NextResponse.json({ ok: false, error: "A reason explanation is mandatory when rolling back a feature flag." }, { status: 400 });
    }

    const result = await rollbackFeatureFlag({
      adminId: adminCtx.user.id,
      flagKey: body.flagKey,
      targetState: body.targetState,
      reason: body.reason,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      flagItem: result.flagItem,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to rollback feature flag." },
      { status: 500 }
    );
  }
}
