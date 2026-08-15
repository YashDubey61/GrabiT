import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { getSuperAdminIncidents } from "@/lib/incidents/incident_service";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "ALL";
    const status = searchParams.get("status") || "ALL";

    const data = await getSuperAdminIncidents(category, status);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err) {
    console.error("Failed to fetch superadmin incidents:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
