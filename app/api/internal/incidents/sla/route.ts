import { NextRequest, NextResponse } from "next/server";
import { evaluateAllOpenIncidentSLAs } from "@/lib/incidents/sla_engine";

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

    if (!providedSecret) {
      return NextResponse.json(
        { error: "Unauthorized: Missing CRON_SECRET authorization header." },
        { status: 401 },
      );
    }

    if (providedSecret !== expectedSecret) {
      return NextResponse.json(
        { error: "Forbidden: Invalid CRON_SECRET provided." },
        { status: 403 },
      );
    }

    // 2. Execute Automated Incident SLA Evaluation & Escalation
    const summary = await evaluateAllOpenIncidentSLAs();

    return NextResponse.json(
      {
        ok: true,
        message: "Automated Incident SLA evaluation and escalation completed.",
        summary,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      },
    );
  } catch (err) {
    console.error("Failed to run automated incident SLA evaluation:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
