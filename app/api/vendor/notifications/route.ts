import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { getVendorOperationalNotifications } from "@/lib/notifications/operational_notifications";

export async function GET() {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { error: "Unauthorized: Vendor authentication required." },
        { status: 401 },
      );
    }

    if (vendorCtx.role !== "vendor") {
      return NextResponse.json(
        { error: "Forbidden: Vendor access required." },
        { status: 403 },
      );
    }

    // Client query parameters trying to spoof canteen scope (?canteen_id=..., ?vendor_id=...) are explicitly ignored!
    const data = await getVendorOperationalNotifications();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err) {
    console.error("Failed to fetch vendor operational notifications:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
