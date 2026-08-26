import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface DeviceTokenPayload {
  token: string;
  deviceType?: string;
  deviceName?: string;
}

/**
 * Registers/refreshes an FCM device token for the authenticated student.
 * Mirrors app/api/vendor/push-token/route.ts's pattern. Called on app
 * start (once a token is available) and whenever Firebase rotates the
 * token — the upsert on `token` means a rotated token from the same
 * device just becomes a new row rather than colliding with the old one,
 * and the old row is left inactive by attrition (or explicitly removed
 * via DELETE on logout).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized: Student authentication required." }, { status: 401 });
    }

    const body = (await request.json()) as DeviceTokenPayload;
    if (!body.token || typeof body.token !== "string" || body.token.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "Push token is required." }, { status: 400 });
    }

    const token = body.token.trim();
    const deviceType = body.deviceType || "android";
    const deviceName = body.deviceName || "Android Student Device";

    const admin = getSupabaseAdminClient();
    const nowIso = new Date().toISOString();

    // 1. Deactivate any existing active tokens for this student so they do not
    // accumulate duplicate active tokens upon token rotation, reinstall, or re-auth.
    await admin
      .from("student_device_tokens")
      .update({ is_active: false, updated_at: nowIso })
      .eq("user_id", user.id)
      .neq("token", token);

    // 2. Upsert the current token as the single active token for this student/device.
    // If the token was previously registered to a different user (e.g. account switch
    // on a shared device), onConflict: "token" reassigns ownership to the current student.
    const { error } = await admin.from("student_device_tokens").upsert(
      {
        user_id: user.id,
        token,
        device_type: deviceType,
        device_name: deviceName,
        is_active: true,
        updated_at: nowIso,
        last_active_at: nowIso,
      },
      { onConflict: "token" },
    );

    if (error) {
      console.warn("Could not register student push token:", error.message);
      return NextResponse.json({ ok: false, error: "Failed to store device token." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, registered: true });
  } catch (err) {
    console.error("Error in student push token endpoint:", err);
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}

/** Deactivates a device token — called on logout so a signed-out device
 * stops receiving another student's future order notifications after a
 * different account signs in on the same device. */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized: Student authentication required." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as DeviceTokenPayload | null;
    if (!body?.token) {
      return NextResponse.json({ ok: false, error: "Token is required to unregister." }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    await admin
      .from("student_device_tokens")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("token", body.token)
      .eq("user_id", user.id);

    return NextResponse.json({ ok: true, unregistered: true });
  } catch (err) {
    console.error("Error unregistering student push token:", err);
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}
