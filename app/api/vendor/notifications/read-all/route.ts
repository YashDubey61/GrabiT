import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { markAllVendorNotificationsAsRead } from "@/lib/notifications/operational_notifications";

export async function POST() {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Vendor authentication required." },
        { status: 401 },
      );
    }

    const success = await markAllVendorNotificationsAsRead();
    if (!success) {
      return NextResponse.json(
        { ok: false, error: "Failed to mark all notifications as read." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Mark all notifications read error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 },
    );
  }
}
