import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendStudentBatchPushNotification } from "@/lib/notifications/student_push_service";

interface BroadcastPayload {
  title: string;
  message: string;
  targetScope: "all" | "campus" | "student";
  campusId?: string;
  studentId?: string;
  actionUrl?: string;
}

/**
 * Super Admin Broadcast API.
 * Securely role-gated on the server side: only authenticated users with
 * `role === 'admin'` may compose and trigger platform notifications.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Admin authentication required." },
        { status: 401 },
      );
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (dbUser?.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden: Super Admin access required." },
        { status: 403 },
      );
    }

    const admin = getSupabaseAdminClient();

    // Fetch live campuses
    const { data: campuses } = await admin
      .from("campuses")
      .select("id, name")
      .order("name", { ascending: true });

    // Fetch active students for selector
    const { data: students } = await admin
      .from("users")
      .select("id, phone, full_name, grabit_user_id, campus_id")
      .eq("role", "student")
      .order("created_at", { ascending: false })
      .limit(100);

    // Fetch recent broadcasts audit from student_notifications
    const { data: recentBroadcasts } = await admin
      .from("student_notifications")
      .select("id, title, message, type, action_url, created_at, user_id")
      .in("type", ["CAMPUS_ANNOUNCEMENT", "ADMIN_MESSAGE"])
      .order("created_at", { ascending: false })
      .limit(30);

    return NextResponse.json({
      ok: true,
      campuses: campuses || [],
      students: students || [],
      recentBroadcasts: recentBroadcasts || [],
    });
  } catch (err) {
    console.error("Error in superadmin broadcast GET:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load broadcast telemetry." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Admin authentication required." },
        { status: 401 },
      );
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (dbUser?.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden: Super Admin access required." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as BroadcastPayload;

    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { ok: false, error: "Notification title is required." },
        { status: 400 },
      );
    }
    if (!body.message || !body.message.trim()) {
      return NextResponse.json(
        { ok: false, error: "Notification message body is required." },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdminClient();

    // 1. Resolve Target User IDs
    let targetUserIds: string[] = [];
    let targetLabel = "All Students";

    if (body.targetScope === "campus") {
      if (!body.campusId) {
        return NextResponse.json(
          { ok: false, error: "Campus selection is required for campus-targeted broadcasts." },
          { status: 400 },
        );
      }
      const { data: campusUsers } = await admin
        .from("users")
        .select("id")
        .eq("role", "student")
        .eq("campus_id", body.campusId);

      targetUserIds = (campusUsers || []).map((u) => u.id);

      const { data: campusData } = await admin
        .from("campuses")
        .select("name")
        .eq("id", body.campusId)
        .single();
      targetLabel = campusData ? `Campus: ${campusData.name}` : `Campus ID: ${body.campusId}`;
    } else if (body.targetScope === "student") {
      if (!body.studentId) {
        return NextResponse.json(
          { ok: false, error: "Student ID is required for direct student notifications." },
          { status: 400 },
        );
      }
      targetUserIds = [body.studentId];
      targetLabel = `Student ID: ${body.studentId}`;
    } else {
      // All Students
      const { data: allUsers } = await admin
        .from("users")
        .select("id")
        .eq("role", "student");
      targetUserIds = (allUsers || []).map((u) => u.id);
      targetLabel = "All Registered Students";
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No matching student users found for the selected recipient scope.",
        },
        { status: 404 },
      );
    }

    const notifType = body.targetScope === "campus" ? "CAMPUS_ANNOUNCEMENT" : "ADMIN_MESSAGE";
    const actionUrl = body.actionUrl?.trim() || "/customer/notifications";

    // 2. Insert in-app notifications for each targeted user
    const notificationsToInsert = targetUserIds.map((userId) => ({
      user_id: userId,
      type: notifType,
      title: body.title.trim(),
      message: body.message.trim(),
      severity: "INFO",
      category: "GENERAL",
      action_url: actionUrl,
      created_at: new Date().toISOString(),
    }));

    // Batch insert notifications (chunks of 100 to avoid request size limits)
    const chunkSize = 100;
    for (let i = 0; i < notificationsToInsert.length; i += chunkSize) {
      const chunk = notificationsToInsert.slice(i, i + chunkSize);
      await admin.from("student_notifications").insert(chunk);
    }

    // 3. Dispatch FCM Push Notifications
    const pushResult = await sendStudentBatchPushNotification({
      userIds: targetUserIds,
      type: notifType,
      title: body.title.trim(),
      body: body.message.trim(),
      actionUrl,
    });

    return NextResponse.json({
      ok: true,
      targetScope: body.targetScope,
      targetLabel,
      totalTargetedStudents: targetUserIds.length,
      deviceTokensFound: pushResult.totalTokens,
      dispatchedCount: pushResult.dispatchedCount,
      failedCount: pushResult.failedCount,
      message: `Notification broadcast dispatched to ${targetUserIds.length} student(s) (${pushResult.dispatchedCount} push notifications delivered).`,
    });
  } catch (err) {
    console.error("Error in superadmin broadcast POST:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error dispatching broadcast." },
      { status: 500 },
    );
  }
}
