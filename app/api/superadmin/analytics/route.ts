import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  getSuperAdminProductAnalytics,
  type AnalyticsTimeframe,
} from "@/lib/supabase/product_analytics";

const VALID_TIMEFRAMES = new Set<AnalyticsTimeframe>(["today", "7d", "30d", "90d"]);

export async function GET(request: NextRequest) {
  try {
    // 1. Enforce strict Super Admin role authorization
    const authContext = await getAuthenticatedSuperAdminContext();

    if (!authContext) {
      // Check if user is authenticated at all to distinguish 401 vs 403
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
    const { searchParams } = new URL(request.url);
    const timeframeParam = searchParams.get("timeframe") ?? "30d";

    if (!VALID_TIMEFRAMES.has(timeframeParam as AnalyticsTimeframe)) {
      return NextResponse.json(
        {
          error:
            "Invalid timeframe parameter. Supported values: today, 7d, 30d, 90d.",
        },
        { status: 400 },
      );
    }

    const timeframe = timeframeParam as AnalyticsTimeframe;

    // 3. Fetch aggregated real product analytics
    const analyticsData = await getSuperAdminProductAnalytics(timeframe);

    return NextResponse.json(analyticsData, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err) {
    console.error("Failed to fetch Super Admin Product Analytics:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
