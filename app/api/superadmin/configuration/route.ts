import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchPlatformConfigurations,
  fetchConfigurationOverviewStats,
  updatePlatformConfiguration,
} from "@/lib/supabase/superadmin_configuration";

/**
 * GET /api/superadmin/configuration
 * Returns Overview KPI stats and platform configuration items.
 * Server-authoritative Super Admin role guard via getAuthenticatedSuperAdminContext().
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const isHighImpact = searchParams.get("isHighImpact") === "true";

  try {
    const [stats, configurations] = await Promise.all([
      fetchConfigurationOverviewStats(),
      fetchPlatformConfigurations(category, search, isHighImpact),
    ]);

    return NextResponse.json({
      ok: true,
      stats,
      configurations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load platform configuration." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/superadmin/configuration
 * Updates a platform business configuration setting.
 * Enforces server-side type validation, range checks, high-impact reasoning, and audit logging.
 */
export async function PUT(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      configKey?: string;
      newValue?: any;
      reason?: string;
    };

    if (!body.configKey) {
      return NextResponse.json({ ok: false, error: "Missing required parameter: configKey" }, { status: 400 });
    }

    const result = await updatePlatformConfiguration({
      adminId: adminCtx.user.id,
      configKey: body.configKey,
      newValue: body.newValue,
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
      { ok: false, error: error?.message || "Failed to update platform configuration." },
      { status: 500 }
    );
  }
}
