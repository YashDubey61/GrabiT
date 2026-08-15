import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { updateLiveCampus } from "@/lib/supabase/superadmin_campuses";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await getAuthenticatedSuperAdminContext();

    if (!authContext) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Only Super Admin accounts can update campuses." },
        { status: 403 },
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Campus ID is required." },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name, location, status, logisticsLeadName } = body;

    const updatedCampus = await updateLiveCampus(id, {
      name,
      location,
      status,
      logisticsLeadName,
    });

    return NextResponse.json({
      ok: true,
      campus: updatedCampus,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to update campus.";
    return NextResponse.json(
      { ok: false, error: errMsg },
      { status: 500 },
    );
  }
}
