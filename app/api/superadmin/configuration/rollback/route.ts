import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { rollbackPlatformConfiguration } from "@/lib/supabase/superadmin_configuration";

/**
 * POST /api/superadmin/configuration/rollback
 * Restores a platform configuration to a historical value.
 * Creates a NEW platform_config_rollback audit log without mutating past audit events.
 */
export async function POST(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      configKey?: string;
      targetValue?: any;
      reason?: string;
    };

    if (!body.configKey) {
      return NextResponse.json({ ok: false, error: "Missing required parameter: configKey" }, { status: 400 });
    }

    if (body.targetValue === undefined) {
      return NextResponse.json({ ok: false, error: "Missing required parameter: targetValue" }, { status: 400 });
    }

    if (!body.reason?.trim()) {
      return NextResponse.json({ ok: false, error: "A reason explanation is mandatory when rolling back configuration." }, { status: 400 });
    }

    const result = await rollbackPlatformConfiguration({
      adminId: adminCtx.user.id,
      configKey: body.configKey,
      targetValue: body.targetValue,
      reason: body.reason,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      configItem: result.configItem,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to rollback configuration." },
      { status: 500 }
    );
  }
}
