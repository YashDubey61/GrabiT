import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: notificationId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Student authentication required." },
        { status: 401 },
      );
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (dbUser?.role !== "student") {
      return NextResponse.json(
        { error: "Forbidden: Student access required." },
        { status: 403 },
      );
    }

    // RLS check: auth.uid() = user_id enforced in database, plus explicit filter
    const { error } = await supabase
      .from("student_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to mark notification as read." },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Failed to patch notification read state:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
