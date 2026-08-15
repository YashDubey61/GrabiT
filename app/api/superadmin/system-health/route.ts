import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { getSystemHealthTelemetry } from "@/lib/observability/slo_engine";

export async function GET() {
  try {
    const adminCtx = await getAuthenticatedSuperAdminContext();
    if (!adminCtx) {
      return NextResponse.json(
        { error: "Unauthorized: Super Admin authentication required." },
        { status: 401 },
      );
    }

    if (adminCtx.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin access required." },
        { status: 403 },
      );
    }

    const data = await getSystemHealthTelemetry();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err) {
    console.error("Failed to fetch superadmin system health telemetry:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
