import { NextRequest, NextResponse } from "next/server";
import { runScheduledJobs } from "@/lib/workflows/workflow_engine";

export async function POST(request: NextRequest) {
  try {
    // 1. CRON_SECRET Authorization Enforcement
    const authHeader = request.headers.get("authorization");
    const headerSecret = request.headers.get("x-cron-secret");

    const expectedSecret =
      process.env.CRON_SECRET ||
      process.env.INTERNAL_WORKFLOW_SECRET ||
      "grabit_cron_secret_day49";

    const bearerToken = authHeader ? authHeader.replace("Bearer ", "").trim() : null;
    const providedSecret = bearerToken || headerSecret;

    if (!providedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing CRON_SECRET." },
        { status: 401 },
      );
    }

    // 2. Extract optional ?cadence= parameter
    const { searchParams } = new URL(request.url);
    const cadenceParam = (searchParams.get("cadence")?.toUpperCase() || "ALL") as
      | "HIGH"
      | "MEDIUM"
      | "DAILY"
      | "ALL";

    // 3. Execute Scheduled Workflow Jobs for target cadence
    const telemetry = await runScheduledJobs(cadenceParam);

    return NextResponse.json({
      ok: true,
      cadenceExecuted: cadenceParam,
      message: `Automated workflow engine scheduled jobs (${cadenceParam}) completed.`,
      telemetry,
    }, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err) {
    console.error("Internal workflow run endpoint error:", err);
    return NextResponse.json(
      { error: "Internal Server Error running workflow engine." },
      { status: 500 },
    );
  }
}
