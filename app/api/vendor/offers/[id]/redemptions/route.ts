import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Please sign in with a vendor account." },
        { status: 401 },
      );
    }

    const { id: offerId } = await params;
    const supabase = getSupabaseAdminClient();

    // Verify offer ownership
    const { data: dbOffer } = await supabase
      .from("promo_codes")
      .select("id, canteen_id")
      .eq("id", offerId)
      .limit(1);

    if (!dbOffer || dbOffer.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Offer not found." },
        { status: 404 },
      );
    }

    if (dbOffer[0].canteen_id !== vendorCtx.canteenId) {
      return NextResponse.json(
        { ok: false, error: "Forbidden. You do not have permission to view redemptions for this offer." },
        { status: 403 },
      );
    }

    const { data: redemptions, error } = await supabase
      .from("promo_code_redemptions")
      .select(`
        id,
        order_id,
        discount_amount,
        created_at,
        orders ( order_number, total_amount )
      `)
      .eq("promo_code_id", offerId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Failed to fetch redemptions." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, redemptions });
  } catch (err) {
    console.error("Vendor offer redemptions GET error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 },
    );
  }
}
