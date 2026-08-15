import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  getSuperAdminRetentionAnalytics,
  type RetentionTimeframe,
} from "@/lib/supabase/retention_analytics";

const VALID_TIMEFRAMES = new Set<RetentionTimeframe>(["today", "7d", "30d", "90d"]);

export async function GET(request: NextRequest) {
  try {
    // 1. Server-authoritative Super Admin role authorization
    const authContext = await getAuthenticatedSuperAdminContext();

    if (!authContext) {
      return NextResponse.json(
        { error: "Unauthorized: Super Admin credentials required." },
        { status: 401 },
      );
    }

    if (authContext.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin access required." },
        { status: 403 },
      );
    }

    // 2. Parse & Validate timeframe parameter (default to 30d)
    // Note: Query parameters attempting identity spoofing (?role=admin, ?user_id=...) are explicitly ignored!
    const { searchParams } = new URL(request.url);
    const timeframeParam = searchParams.get("timeframe") ?? "30d";

    if (!VALID_TIMEFRAMES.has(timeframeParam as RetentionTimeframe)) {
      return NextResponse.json(
        {
          error:
            "Invalid timeframe parameter. Supported values: today, 7d, 30d, 90d.",
        },
        { status: 400 },
      );
    }

    const timeframe = timeframeParam as RetentionTimeframe;

    // 3. Fetch aggregated real retention and cohort analytics
    const retentionData = await getSuperAdminRetentionAnalytics(timeframe);

    return NextResponse.json(retentionData, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err) {
    console.error("Failed to fetch Super Admin Retention Analytics:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
