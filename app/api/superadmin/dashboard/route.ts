import { NextResponse } from "next/server";
import {
  getAuthenticatedSuperAdminContext,
  getSuperAdminGlobalMetrics,
} from "@/lib/supabase/superadmin";

export async function GET() {
  try {
    const authContext = await getAuthenticatedSuperAdminContext();

    if (!authContext) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Only Super Admin accounts can access global dashboard metrics." },
        { status: 403 },
      );
    }

    const data = await getSuperAdminGlobalMetrics();

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to load Super Admin global telemetry." },
      { status: 500 },
    );
  }
}
