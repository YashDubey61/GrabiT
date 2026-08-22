import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchSupportTicketDetail,
  updateSupportTicketAction,
} from "@/lib/supabase/superadmin_support";

/**
 * GET /api/superadmin/support/[id]
 * Returns full details and message timeline for a support ticket.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Ticket ID is required." }, { status: 400 });
  }

  try {
    const detail = await fetchSupportTicketDetail(id, true);

    if (!detail) {
      return NextResponse.json({ ok: false, error: `Support ticket '${id}' not found.` }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      data: detail,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load ticket detail." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/superadmin/support/[id]
 * Executes ticket action (assign, priority, status, escalate, resolve, reopen).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Ticket ID is required." }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { action, payload, reason } = body;

    if (!action) {
      return NextResponse.json({ ok: false, error: "Action parameter is required." }, { status: 400 });
    }

    const result = await updateSupportTicketAction({
      adminId: adminCtx.user.id,
      ticketId: id,
      action,
      payload,
      reason,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      ticket: result.ticket,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to update ticket action." },
      { status: 500 }
    );
  }
}
