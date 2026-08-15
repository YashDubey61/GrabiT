import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
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

    const { error } = await supabase
      .from("student_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);

    if (error) {
      return NextResponse.json(
        { error: "Failed to mark all notifications as read." },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Failed to mark all notifications as read:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
