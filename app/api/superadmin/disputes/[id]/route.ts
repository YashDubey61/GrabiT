import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchDisputeDetails,
  updateDisputeStatusApi,
  processRefundApi,
  type DisputeStatus,
} from "@/lib/supabase/superadmin_disputes";

/**
 * GET /api/superadmin/disputes/[id]
 * Fetches dispute inspection details, evidence timeline, and refundable balance calculations.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { id: disputeId } = await params;
  if (!disputeId) {
    return NextResponse.json({ ok: false, error: "Missing dispute ID." }, { status: 400 });
  }

  const result = await fetchDisputeDetails(disputeId);
  if (!result.dispute) {
    return NextResponse.json({ ok: false, error: "Dispute not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    dispute: result.dispute,
    timeline: result.timeline,
    refundCalc: result.refundCalc,
  });
}

/**
 * PATCH /api/superadmin/disputes/[id]
 * Super Admin dispute mutations: Update status or Process server-validated refund.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { id: disputeId } = await params;
  if (!disputeId) {
    return NextResponse.json({ ok: false, error: "Missing dispute ID." }, { status: 400 });
  }

  const body = (await request.json()) as {
    action?: "update_status" | "process_refund";
    newStatus?: DisputeStatus;
    resolution?: string;
    refundAmount?: number;
    reason?: string;
  };

  const adminId = adminCtx.user.id;

  // 1. Dispute Status Mutation
  if (body.action === "update_status" && body.newStatus) {
    const res = await updateDisputeStatusApi({
      adminId,
      disputeId,
      newStatus: body.newStatus,
      resolution: body.resolution,
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }
  }

  // 2. Server-Validated Refund Action
  if (body.action === "process_refund" && body.refundAmount) {
    if (!body.reason?.trim()) {
      return NextResponse.json({ ok: false, error: "Reason is required to process a refund." }, { status: 400 });
    }

    const res = await processRefundApi({
      adminId,
      disputeId,
      refundAmount: body.refundAmount,
      reason: body.reason,
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, message: "Dispute updated successfully." });
}
