import { NextResponse } from "next/server";
import { getAuthenticatedStudentContext, searchStudents } from "@/lib/rewards/server";

export async function GET(request: Request) {
  const ctx = await getAuthenticatedStudentContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const results = await searchStudents(q, ctx.userId);
  return NextResponse.json({ ok: true, results });
}
