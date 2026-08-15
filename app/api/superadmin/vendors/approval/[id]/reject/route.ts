import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { rejectLiveVendorRequest } from "@/lib/supabase/superadmin_vendors";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await getAuthenticatedSuperAdminContext();

    if (!authContext) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Only Super Admin accounts can reject vendor requests." },
        { status: 403 },
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Request ID is required." },
        { status: 400 },
      );
    }

    const result = await rejectLiveVendorRequest(id, authContext.user.id);

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to reject request.";
    return NextResponse.json(
      { ok: false, error: errMsg },
      { status: 500 },
    );
  }
}
