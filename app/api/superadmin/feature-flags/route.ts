import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchFeatureFlags,
  fetchFeatureFlagOverviewStats,
  createFeatureFlag,
  updateFeatureFlag,
  triggerEmergencyKillSwitch,
} from "@/lib/supabase/superadmin_feature_flags";

/**
 * GET /api/superadmin/feature-flags
 * Returns Overview KPI stats and feature flags directory.
 * Server-authoritative Super Admin role guard.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const environment = searchParams.get("environment") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  try {
    const [stats, flags] = await Promise.all([
      fetchFeatureFlagOverviewStats(),
      fetchFeatureFlags(category, status, environment, search),
    ]);

    return NextResponse.json({
      ok: true,
      stats,
      flags,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load feature flags." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/feature-flags
 * Creates a new feature flag with unique key check and audit logging.
 */
export async function POST(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.key || !body.name) {
      return NextResponse.json({ ok: false, error: "Feature flag 'key' and 'name' are mandatory." }, { status: 400 });
    }

    const result = await createFeatureFlag({
      adminId: adminCtx.user.id,
      flag: body,
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
      { ok: false, error: error?.message || "Failed to create feature flag." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/superadmin/feature-flags
 * Updates a feature flag or triggers emergency kill switch.
 */
export async function PUT(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      flagKey?: string;
      updates?: any;
      reason?: string;
      isKillSwitch?: boolean;
    };

    if (!body.flagKey) {
      return NextResponse.json({ ok: false, error: "Missing required parameter: flagKey" }, { status: 400 });
    }

    if (body.isKillSwitch) {
      const killResult = await triggerEmergencyKillSwitch({
        adminId: adminCtx.user.id,
        flagKey: body.flagKey,
        reason: body.reason || "Emergency Kill Switch Triggered",
      });

      if (!killResult.ok) {
        return NextResponse.json({ ok: false, error: killResult.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true, flagItem: killResult.flagItem });
    }

    const result = await updateFeatureFlag({
      adminId: adminCtx.user.id,
      flagKey: body.flagKey,
      updates: body.updates || {},
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
      { ok: false, error: error?.message || "Failed to update feature flag." },
      { status: 500 }
    );
  }
}
