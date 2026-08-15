import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentRecommendations } from "@/lib/supabase/student_recommendations";

export async function GET() {
  try {
    // 1. Server-authoritative Student role authorization
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

    // 2. Fetch authenticated student recommendations
    // Client query parameters trying to spoof identity (?student_id=..., ?user_id=..., ?campus_id=...) are explicitly ignored!
    const recommendationsData = await getStudentRecommendations();

    return NextResponse.json(recommendationsData, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err) {
    console.error("Failed to fetch Student Recommendations:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
