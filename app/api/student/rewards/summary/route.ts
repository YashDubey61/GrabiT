import { NextResponse } from "next/server";
import { getAuthenticatedStudentContext, getRewardSummary } from "@/lib/rewards/server";

export async function GET() {
  const ctx = await getAuthenticatedStudentContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }
  const summary = await getRewardSummary(ctx);
  return NextResponse.json({ ok: true, summary });
}
