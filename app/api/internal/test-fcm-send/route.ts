import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendFcmV1Message, isFcmV1Configured } from "@/lib/notifications/fcm_v1";

/**
 * TEMPORARY, one-off diagnostic route for verifying the FCM HTTP v1 send
 * path actually works against a real registered device token, without
 * exposing the service account or any token value. Not part of the
 * product's notification architecture — order-status transitions already
 * dispatch through lib/notifications/student_push_service.ts; this route
 * exists only to prove that pipeline is reachable before relying on it.
 * Delete after use.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader ? authHeader.replace("Bearer ", "").trim() : null;
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || !bearerToken || bearerToken !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFcmV1Configured()) {
    return NextResponse.json({ ok: false, error: "FCM_SERVICE_ACCOUNT_JSON not configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { userId?: string } | null;
  if (!body?.userId) {
    return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const { data: tokens, error } = await admin
    .from("student_device_tokens")
    .select("id, token")
    .eq("user_id", body.userId)
    .eq("is_active", true);

  if (error || !tokens || tokens.length === 0) {
    return NextResponse.json({ ok: false, error: "No active device token for this user" }, { status: 404 });
  }

  const results = await Promise.all(
    tokens.map(async ({ id }) => {
      const row = tokens.find((t) => t.id === id)!;
      const result = await sendFcmV1Message({
        token: row.token,
        title: "GRABIT",
        body: "Test notification — FCM HTTP v1 diagnostic send.",
        channelId: "grabit_orders_channel_v1",
        data: { type: "DIAGNOSTIC_TEST", timestamp: new Date().toISOString() },
      });
      return { deviceTokenId: id, ok: result.ok, error: result.ok ? undefined : result.error };
    }),
  );

  return NextResponse.json({ ok: true, results });
}
