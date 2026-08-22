import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchRiskCaseDetails,
  updateRiskCaseStatusApi,
  addRiskCaseNoteApi,
  type CaseStatus,
} from "@/lib/supabase/superadmin_risk";

/**
 * GET /api/superadmin/risk/[id]
 * Fetches risk case inspection details, evidence timeline, and investigation notes.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { id: caseId } = await params;
  if (!caseId) {
    return NextResponse.json({ ok: false, error: "Missing case ID." }, { status: 400 });
  }

  const result = await fetchRiskCaseDetails(caseId);
  if (!result.caseItem) {
    return NextResponse.json({ ok: false, error: "Risk case not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    caseItem: result.caseItem,
    timeline: result.timeline,
  });
}

/**
 * PATCH /api/superadmin/risk/[id]
 * Super Admin case operations: Update case status (OPEN, INVESTIGATING, RESOLVED, DISMISSED) or Add investigation note.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { id: caseId } = await params;
  if (!caseId) {
    return NextResponse.json({ ok: false, error: "Missing case ID." }, { status: 400 });
  }

  const body = (await request.json()) as {
    action?: "update_status" | "add_note";
    newStatus?: CaseStatus;
    resolution?: string;
    noteContent?: string;
  };

  const adminId = adminCtx.user.id;

  // 1. Update Case Status Action
  if (body.action === "update_status" && body.newStatus) {
    const res = await updateRiskCaseStatusApi({
      adminId,
      caseId,
      newStatus: body.newStatus,
      resolution: body.resolution,
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }
  }

  // 2. Add Investigation Note Action
  if (body.action === "add_note" && body.noteContent) {
    const res = await addRiskCaseNoteApi({
      adminId,
      caseId,
      noteContent: body.noteContent,
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, message: "Risk case updated successfully." });
}
