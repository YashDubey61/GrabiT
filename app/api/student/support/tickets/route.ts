import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { isSupportCategoryId } from "@/lib/support/categories";
import { isOrderIssueTypeId } from "@/lib/support/issue_types";

interface CreateTicketPayload {
  category?: unknown;
  issueType?: unknown;
  subject?: unknown;
  description?: unknown;
  relatedOrderId?: unknown;
}

/**
 * Help & Support tickets. Not money-adjacent — unlike the payment RPCs,
 * there's no privileged cross-table write here, so this operates through
 * the user's own RLS-bound server client throughout (no admin client).
 * RLS policies (support_tickets insert/select "with check/using auth.uid()
 * = user_id") are what actually make cross-user access impossible, not
 * just the route's own checks.
 */
export async function POST(request: Request) {
  const supabaseServer = await createServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabaseServer.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: "Please sign in to contact support." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CreateTicketPayload | null;
  const category = body?.category;
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const issueType = body?.issueType;
  const relatedOrderId = typeof body?.relatedOrderId === "string" ? body.relatedOrderId : null;

  if (!isSupportCategoryId(category)) {
    return NextResponse.json({ ok: false, error: "Select a valid support category." }, { status: 400 });
  }
  if (!subject) {
    return NextResponse.json({ ok: false, error: "Add a subject for your request." }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json({ ok: false, error: "Describe the issue so we can help." }, { status: 400 });
  }
  if (issueType !== undefined && issueType !== null && !isOrderIssueTypeId(issueType)) {
    return NextResponse.json({ ok: false, error: "Invalid issue type." }, { status: 400 });
  }

  if (relatedOrderId) {
    // Ownership check — a student may only attach their own order.
    const { data: order } = await supabaseServer
      .from("orders")
      .select("id")
      .eq("id", relatedOrderId)
      .eq("student_id", user.id)
      .maybeSingle();
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
    }
  }

  const { data: ticket, error: insertErr } = await supabaseServer
    .from("support_tickets")
    .insert({
      user_id: user.id,
      category,
      issue_type: issueType ?? null,
      subject,
      description,
      related_order_id: relatedOrderId,
    })
    .select("id, category, issue_type, subject, status, related_order_id, created_at, updated_at")
    .single();

  if (insertErr || !ticket) {
    console.error("support_tickets insert error:", insertErr);
    return NextResponse.json({ ok: false, error: "Couldn't submit your request. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ticket });
}

export async function GET() {
  const supabaseServer = await createServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabaseServer.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });
  }

  const { data: tickets, error } = await supabaseServer
    .from("support_tickets")
    .select("id, category, issue_type, subject, description, status, related_order_id, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("support_tickets list error:", error);
    return NextResponse.json({ ok: false, error: "Couldn't load your support requests." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, tickets: tickets ?? [] });
}
