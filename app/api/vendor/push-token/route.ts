import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface PushTokenPayload {
  token: string;
  deviceType?: string;
  deviceName?: string;
}

export async function POST(request: Request) {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized vendor session." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as PushTokenPayload;
    if (!body.token || typeof body.token !== "string" || body.token.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "Push token is required." },
        { status: 400 }
      );
    }

    const token = body.token.trim();
    const deviceType = body.deviceType || "android";
    const deviceName = body.deviceName || "Android Vendor Terminal";

    const supabase = getSupabaseAdminClient();

    // Upsert token for this vendor and canteen
    const { error } = await supabase.from("vendor_device_tokens").upsert(
      {
        user_id: vendorCtx.userId,
        canteen_id: vendorCtx.canteenId,
        token,
        device_type: deviceType,
        device_name: deviceName,
        is_active: true,
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      },
      { onConflict: "token" }
    );

    if (error) {
      console.warn("Could not register vendor push token:", error.message);
      return NextResponse.json(
        { ok: false, error: "Failed to store device token." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, registered: true });
  } catch (err) {
    console.error("Error in vendor push token endpoint:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized vendor session." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as PushTokenPayload;
    if (!body.token) {
      return NextResponse.json(
        { ok: false, error: "Token is required to unregister." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    await supabase
      .from("vendor_device_tokens")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("token", body.token)
      .eq("user_id", vendorCtx.userId);

    return NextResponse.json({ ok: true, unregistered: true });
  } catch (err) {
    console.error("Error unregistering vendor push token:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
