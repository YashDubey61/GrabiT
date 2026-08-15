import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import {
  acknowledgeOperationalNotification,
  resolveOperationalNotification,
} from "@/lib/notifications/operational_notifications";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: notificationId } = await params;
    const vendorCtx = await getAuthenticatedVendorContext();

    if (!vendorCtx) {
      return NextResponse.json(
        { error: "Unauthorized: Vendor authentication required." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const action = body.action as "ACKNOWLEDGE" | "RESOLVE";

    let success = false;
    if (action === "ACKNOWLEDGE") {
      success = await acknowledgeOperationalNotification(notificationId);
    } else if (action === "RESOLVE") {
      success = await resolveOperationalNotification(notificationId);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Supported: ACKNOWLEDGE, RESOLVE." },
        { status: 400 },
      );
    }

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update notification state or forbidden access." },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Failed to patch vendor operational notification:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
