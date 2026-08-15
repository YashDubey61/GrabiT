import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentNotifications } from "@/lib/notifications/student_notifications";

export async function GET() {
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

    // Client query parameters trying to spoof identity (?user_id=..., ?student_id=...) are explicitly ignored!
    const data = await getStudentNotifications();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err) {
    console.error("Failed to fetch student notifications:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
