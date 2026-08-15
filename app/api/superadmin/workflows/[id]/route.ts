import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  getWorkflowRules,
  executeWorkflowRule,
} from "@/lib/workflows/workflow_engine";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createAdminClient(url, serviceKey);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: ruleId } = await params;
    const adminCtx = await getAuthenticatedSuperAdminContext();

    if (!adminCtx || adminCtx.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Super Admin access required." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const action = body.action as "TOGGLE_ENABLED" | "RUN_NOW";

    const rules = await getWorkflowRules();
    const rule = rules.find((r) => r.id === ruleId);

    if (!rule) {
      return NextResponse.json(
        { error: "Workflow rule not found." },
        { status: 404 },
      );
    }

    if (action === "TOGGLE_ENABLED") {
      const newEnabled = body.enabled ?? !rule.enabled;
      const supabase = getSupabaseAdminClient();

      await supabase
        .from("workflow_rules")
        .update({ enabled: newEnabled, updated_at: new Date().toISOString() })
        .eq("id", ruleId);

      return NextResponse.json({ success: true, enabled: newEnabled }, { status: 200 });
    } else if (action === "RUN_NOW") {
      const executionKey = `manual:${rule.eventType}:${adminCtx.user.id}:${Date.now()}`;
      const result = await executeWorkflowRule(rule, executionKey, {
        message: `Manual execution triggered by Super Admin ${adminCtx.user.email ?? ""}.`,
      });

      return NextResponse.json({ success: result.success, result }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Invalid action. Supported: TOGGLE_ENABLED, RUN_NOW." },
      { status: 400 },
    );
  } catch (err) {
    console.error("Failed to patch workflow rule:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
