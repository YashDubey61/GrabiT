import { NextResponse } from "next/server";
import { getAuthenticatedAdminOrNull, getRewardsAnalytics } from "@/lib/rewards/analytics-server";
import type { RewardsAnalyticsRange } from "@/lib/rewards/analytics-types";

const VALID_RANGES: RewardsAnalyticsRange[] = ["today", "7d", "30d", "90d", "month", "year"];

export async function GET(request: Request) {
  try {
    const ctx = await getAuthenticatedAdminOrNull();
    if (!ctx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Super Admin authorization required." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const rangeParam = (searchParams.get("range") ?? "30d") as RewardsAnalyticsRange;
    if (!VALID_RANGES.includes(rangeParam)) {
      return NextResponse.json(
        { ok: false, error: `Invalid range. Allowed values: ${VALID_RANGES.join(", ")}.` },
        { status: 400 },
      );
    }
    const canteenId = searchParams.get("canteenId") || null;

    const data = await getRewardsAnalytics(rangeParam, canteenId);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("Super Admin Rewards Analytics API error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error computing rewards analytics." },
      { status: 500 },
    );
  }
}
