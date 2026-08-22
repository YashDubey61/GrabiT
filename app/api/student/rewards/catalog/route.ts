import { NextResponse } from "next/server";
import { getAuthenticatedStudentContext, getRewardCatalog } from "@/lib/rewards/server";

export async function GET() {
  const ctx = await getAuthenticatedStudentContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }
  const catalog = await getRewardCatalog();
  return NextResponse.json({ ok: true, catalog });
}
