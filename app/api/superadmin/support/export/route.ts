import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchSupportTicketsDirectory,
  type SupportQueue,
} from "@/lib/supabase/superadmin_support";

/**
 * GET /api/superadmin/support/export
 * Generates a CSV report of support tickets without unmasked customer PII.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const queue = (searchParams.get("queue") || "ALL") as SupportQueue;
  const search = searchParams.get("search") || undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const campusId = searchParams.get("campusId") ?? undefined;

  try {
    const tickets = await fetchSupportTicketsDirectory(
      queue,
      search,
      priority,
      status,
      category,
      campusId,
      adminCtx.user.id
    );

    const headers = [
      "Ticket Number",
      "Created Date",
      "Customer Name",
      "Category",
      "Issue Type",
      "Subject",
      "Related Order ID",
      "Campus",
      "Priority",
      "Status",
      "Assigned Admin",
      "SLA Status",
      "Resolved Date",
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = tickets.map((t) => [
      escapeCsv(t.ticketNumber),
      escapeCsv(t.createdAt),
      escapeCsv(t.customerName),
      escapeCsv(t.category),
      escapeCsv(t.issueType),
      escapeCsv(t.subject),
      escapeCsv(t.relatedOrderId || "N/A"),
      escapeCsv(t.campusName || "N/A"),
      escapeCsv(t.priority),
      escapeCsv(t.status),
      escapeCsv(t.assignedAdminName || "Unassigned"),
      escapeCsv(t.slaStatus),
      escapeCsv(t.resolvedAt || "Unresolved"),
    ]);

    const csvString = [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\n");

    const dateSuffix = new Date().toISOString().split("T")[0];
    return new Response(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="grabit_support_tickets_${dateSuffix}.csv"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate support report." },
      { status: 500 }
    );
  }
}
