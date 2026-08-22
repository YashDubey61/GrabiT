import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { addSupportTicketMessage } from "@/lib/supabase/superadmin_support";

/**
 * POST /api/superadmin/support/[id]/messages
 * Adds an internal admin note or customer reply to a support ticket.
 */
export async function POST(
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
    const { message, messageType } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ ok: false, error: "Message text is required." }, { status: 400 });
    }

    const result = await addSupportTicketMessage({
      adminId: adminCtx.user.id,
      ticketId: id,
      message,
      messageType: messageType === "INTERNAL_NOTE" ? "INTERNAL_NOTE" : "CUSTOMER_MESSAGE",
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      messageItem: result.messageItem,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to post support ticket message." },
      { status: 500 }
    );
  }
}
