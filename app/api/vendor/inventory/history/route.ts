import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Please sign in with a vendor account." },
        { status: 401 },
      );
    }

    const supabase = getSupabaseAdminClient();
    const { data: logs, error } = await supabase
      .from("inventory_logs")
      .select(`
        *,
        menu_items ( name )
      `)
      .eq("canteen_id", vendorCtx.canteenId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Failed to fetch inventory history." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, logs });
  } catch (err) {
    console.error("Vendor inventory history GET error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 },
    );
  }
}
