import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  acknowledgeIncident,
  escalateIncident,
  resolveIncident,
} from "@/lib/incidents/incident_service";
import { validateLifecycleTransition } from "@/lib/incidents/sla_engine";
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
    const { id: incidentId } = await params;
    const adminCtx = await getAuthenticatedSuperAdminContext();

    if (!adminCtx || adminCtx.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Super Admin access required." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const action = body.action as "ACKNOWLEDGE" | "START_WORK" | "ESCALATE" | "RESOLVE" | "CLOSE";

    const targetStatusMap: Record<string, "ACKNOWLEDGED" | "IN_PROGRESS" | "ESCALATED" | "RESOLVED" | "CLOSED"> = {
      ACKNOWLEDGE: "ACKNOWLEDGED",
      START_WORK: "IN_PROGRESS",
      ESCALATE: "ESCALATED",
      RESOLVE: "RESOLVED",
      CLOSE: "CLOSED",
    };

    const targetStatus = targetStatusMap[action];
    if (!targetStatus) {
      return NextResponse.json(
        { error: "Invalid action. Supported: ACKNOWLEDGE, START_WORK, ESCALATE, RESOLVE, CLOSE." },
        { status: 400 },
      );
    }

    // 1. Fetch Current Incident Status for Server-Side Lifecycle Guard
    const supabase = getSupabaseAdminClient();
    const { data: currentInc } = await supabase
      .from("operational_incidents")
      .select("status")
      .eq("id", incidentId)
      .single();

    if (currentInc) {
      const transitionCheck = validateLifecycleTransition(currentInc.status, targetStatus);
      if (!transitionCheck.valid) {
        return NextResponse.json(
          { error: transitionCheck.reason },
          { status: 400 },
        );
      }
    }

    let success = false;
    if (action === "ACKNOWLEDGE") {
      success = await acknowledgeIncident(incidentId);
    } else if (action === "START_WORK") {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("operational_incidents")
        .update({ status: "IN_PROGRESS", last_updated_at: now })
        .eq("id", incidentId);

      if (!error) {
        await supabase.from("operational_incident_audit").insert({
          incident_id: incidentId,
          actor_id: adminCtx.user.id,
          action: "STATUS_CHANGED",
          notes: "Incident state updated to IN_PROGRESS",
        });
      }
      success = !error;
    } else if (action === "ESCALATE") {
      success = await escalateIncident(incidentId);
    } else if (action === "RESOLVE") {
      const notes = body.resolutionNotes || "Incident resolved by Super Admin.";
      success = await resolveIncident(incidentId, notes);
    } else if (action === "CLOSE") {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("operational_incidents")
        .update({ status: "CLOSED", last_updated_at: now })
        .eq("id", incidentId);

      if (!error) {
        await supabase.from("operational_incident_audit").insert({
          incident_id: incidentId,
          actor_id: adminCtx.user.id,
          action: "CLOSED",
          notes: "Incident case closed.",
        });
      }
      success = !error;
    }

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update incident state." },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Failed to patch operational incident:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
