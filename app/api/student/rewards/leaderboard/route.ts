import { NextResponse } from "next/server";
import { getAuthenticatedStudentContext, getLeaderboard } from "@/lib/rewards/server";
import type { LeaderboardPeriod } from "@/lib/rewards/types";

export async function GET(request: Request) {
  const ctx = await getAuthenticatedStudentContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("period");
  const period: LeaderboardPeriod =
    periodParam === "weekly" || periodParam === "monthly" ? periodParam : "alltime";

  const { entries, currentUserRank } = await getLeaderboard(period, ctx.campusId, ctx.userId);
  return NextResponse.json({ ok: true, entries, currentUserRank });
}
