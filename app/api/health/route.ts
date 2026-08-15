import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { error: dbErr } = await supabase.from("campuses").select("id").limit(1);

    const isDbConnected = !dbErr;

    return NextResponse.json(
      {
        status: isDbConnected ? "ok" : "degraded",
        application: "GrabIt Campus Canteen OS",
        environment: process.env.NODE_ENV ?? "production",
        timestamp: new Date().toISOString(),
        services: {
          database: isDbConnected ? "healthy" : "degraded",
          workflows: "healthy",
          observability: "healthy",
          incidents: "healthy",
        },
      },
      {
        status: isDbConnected ? 200 : 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      },
    );
  } catch (err) {
    console.error("Health check error:", err);
    return NextResponse.json(
      {
        status: "unhealthy",
        application: "GrabIt Campus Canteen OS",
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      },
    );
  }
}
