import { NextResponse } from "next/server";
import { getAuthenticatedStudentContext, getMyRewardRedemptions } from "@/lib/rewards/server";

export async function GET() {
  const ctx = await getAuthenticatedStudentContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }
  const redemptions = await getMyRewardRedemptions(ctx.userId);
  return NextResponse.json({ ok: true, redemptions });
}
