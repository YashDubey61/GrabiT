import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  getSuperAdminCampuses,
  createLiveCampus,
} from "@/lib/supabase/superadmin_campuses";

export async function GET(request: Request) {
  try {
    const authContext = await getAuthenticatedSuperAdminContext();

    if (!authContext) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Only Super Admin accounts can access campus registry." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "ALL";

    const data = await getSuperAdminCampuses(q, status);

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to load campus registry." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authContext = await getAuthenticatedSuperAdminContext();

    if (!authContext) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Only Super Admin accounts can create new campuses." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name, location, status, logisticsLeadName } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { ok: false, error: "Campus name is required." },
        { status: 400 },
      );
    }

    if (!location || typeof location !== "string" || !location.trim()) {
      return NextResponse.json(
        { ok: false, error: "Location / City is required." },
        { status: 400 },
      );
    }

    const createdCampus = await createLiveCampus({
      name,
      location,
      status: status || "ACTIVE",
      logisticsLeadName,
    });

    return NextResponse.json({
      ok: true,
      campus: createdCampus,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to create campus.";
    return NextResponse.json(
      { ok: false, error: errMsg },
      { status: 500 },
    );
  }
}
