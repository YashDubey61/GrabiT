import { NextResponse } from "next/server";
import {
  evaluateFeatureFlag,
  type FeatureFlagContext,
} from "@/lib/supabase/superadmin_feature_flags";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";

/**
 * POST /api/superadmin/feature-flags/evaluate
 * Evaluates feature flag status for a request context (userId, campusId, vendorId, role, environment).
 * Admin-only: flag rollout config/state must not be discoverable by an
 * unauthenticated caller probing arbitrary user/campus/vendor contexts.
 */
export async function POST(request: Request) {
  try {
    const adminCtx = await getAuthenticatedSuperAdminContext();
    if (!adminCtx) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as {
      flagKey?: string;
      context?: FeatureFlagContext;
    };

    if (!body.flagKey) {
      return NextResponse.json({ ok: false, error: "Missing required parameter: flagKey" }, { status: 400 });
    }

    const result = await evaluateFeatureFlag(body.flagKey, body.context || {});

    return NextResponse.json({
      ok: true,
      flagKey: body.flagKey,
      enabled: result.enabled,
      reason: result.reason,
      flag: result.flag,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to evaluate feature flag.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
