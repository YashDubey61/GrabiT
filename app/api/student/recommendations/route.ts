import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentRecommendations } from "@/lib/supabase/student_recommendations";

export async function GET() {
  try {
    // 1. Fetch recommendations (handles personalized if student authenticated, or campus-wide popular picks if guest)
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
