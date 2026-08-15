import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  updateLiveVendorCommission,
  updateLiveVendorTier,
} from "@/lib/supabase/superadmin_vendors";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await getAuthenticatedSuperAdminContext();

    if (!authContext) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Only Super Admin accounts can update vendor configurations." },
        { status: 403 },
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Vendor ID is required." },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { commissionPercent, tier } = body;

    let result;
    if (typeof commissionPercent === "number") {
      result = await updateLiveVendorCommission(id, commissionPercent);
    }

    if (tier === "STD" || tier === "PREM") {
      result = await updateLiveVendorTier(id, tier);
    }

    return NextResponse.json({
      ok: true,
      vendor: result,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to update vendor.";
    return NextResponse.json(
      { ok: false, error: errMsg },
      { status: 500 },
    );
  }
}
