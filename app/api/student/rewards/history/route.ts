import { NextResponse } from "next/server";
import { getAuthenticatedStudentContext, getPointHistory } from "@/lib/rewards/server";

export async function GET() {
  const ctx = await getAuthenticatedStudentContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }
  const history = await getPointHistory(ctx.userId);
  return NextResponse.json({ ok: true, history });
}
