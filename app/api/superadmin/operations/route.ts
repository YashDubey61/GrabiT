import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  getSuperAdminOperationsMetrics,
  type OperationsTimeframe,
} from "@/lib/supabase/superadmin_operations";

export async function GET(request: Request) {
  try {
    // 1. Role Guard & Identity Isolation: Require authenticated Super Admin session
    const superAdminCtx = await getAuthenticatedSuperAdminContext();
    if (!superAdminCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Super Admin authorization required." },
        { status: 403 },
      );
    }

    // 2. Extract & Validate Timeframe Parameter
    const { searchParams } = new URL(request.url);
    const timeframeParam = (searchParams.get("timeframe") ?? "today") as OperationsTimeframe;

    if (timeframeParam !== "today" && timeframeParam !== "7d" && timeframeParam !== "30d") {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid timeframe parameter. Allowed values: 'today', '7d', '30d'.",
        },
        { status: 400 },
      );
    }

    // 3. Aggregate Live Production Operations Telemetry
    const metrics = await getSuperAdminOperationsMetrics(timeframeParam);

    return NextResponse.json({
      ok: true,
      metrics,
    });
  } catch (err) {
    console.error("Super Admin Operations API error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error fetching operational metrics." },
      { status: 500 },
    );
  }
}
