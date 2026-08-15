import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { getSuperAdminVendorOversight } from "@/lib/supabase/superadmin_vendors";

export async function GET() {
  try {
    const authContext = await getAuthenticatedSuperAdminContext();

    if (!authContext) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Only Super Admin accounts can access vendor oversight." },
        { status: 403 },
      );
    }

    const data = await getSuperAdminVendorOversight();

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to load vendor oversight." },
      { status: 500 },
    );
  }
}
