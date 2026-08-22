import { recordSuperAdminAction } from "./superadmin_audit";
import { maskSensitiveData } from "./superadmin_audit";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type SupportQueue =
  | "ALL"
  | "UNASSIGNED"
  | "MY_TICKETS"
  | "HIGH_PRIORITY"
  | "CRITICAL"
  | "WAITING_FOR_CUSTOMER"
  | "WAITING_FOR_VENDOR"
  | "SLA_BREACHED"
  | "RESOLVED";

export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_FOR_CUSTOMER"
  | "WAITING_FOR_VENDOR"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TicketCategory =
  | "ORDERS"
  | "PAYMENTS"
  | "REFUNDS"
  | "DELIVERY"
  | "VENDOR"
  | "ACCOUNT"
  | "COUPON"
  | "TECHNICAL"
  | "OTHER";

export type SlaStatus = "ON_TRACK" | "WARNING" | "BREACHED";

export interface SupportTicketItem {
  id: string;
  ticketNumber: string;
  userId: string;
  customerName: string;
  customerPhone?: string;
  category: TicketCategory;
  issueType: string;
  subject: string;
  description: string;
  relatedOrderId?: string | null;
  canteenId?: string | null;
  canteenName?: string | null;
  campusId?: string | null;
  campusName?: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  assignedAdminId?: string | null;
  assignedAdminName?: string | null;
  slaDueAt?: string | null;
  slaStatus: SlaStatus;
  escalationReason?: string | null;
  resolution?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export interface SupportMessageItem {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderType: "CUSTOMER" | "ADMIN" | "SYSTEM" | "VENDOR";
  messageType: "CUSTOMER_MESSAGE" | "INTERNAL_NOTE" | "SYSTEM_EVENT";
  message: string;
  attachments?: any[];
  createdAt: string;
}

export interface SupportOverviewStats {
  openTickets: number;
  unassignedTickets: number;
  highPriority: number;
  criticalIssues: number;
  waitingForCustomer: number;
  waitingForVendor: number;
  resolvedToday: number;
  avgResolutionTimeMins: number;
}

// In-memory fallback tickets dataset for demonstration and testing
const inMemoryTickets: SupportTicketItem[] = [
  {
    id: "tck_1001",
    ticketNumber: "TCK-1001",
    userId: "usr_student_01",
    customerName: "Aarav Sharma",
    customerPhone: "+91 9876543210",
    category: "PAYMENTS",
    issueType: "PAYMENT_ISSUE",
    subject: "UPI Payment Debited But Order Marked Unpaid",
    description: "₹240 debited via PhonePe UPI for Canteen Order #ORD-8812, but order status shows unpaid.",
    relatedOrderId: "ord_8812_uuid",
    canteenId: "canteens_axis_01",
    canteenName: "Axis Central Canteen",
    campusId: "cmp_axis_01",
    campusName: "PSIT Kanpur",
    priority: "CRITICAL",
    status: "OPEN",
    assignedAdminId: null,
    assignedAdminName: null,
    slaDueAt: new Date(Date.now() + 3600 * 1000 * 2).toISOString(),
    slaStatus: "ON_TRACK",
    createdAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    lastActivityAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
  },
  {
    id: "tck_1002",
    ticketNumber: "TCK-1002",
    userId: "usr_student_02",
    customerName: "Riya Verma",
    customerPhone: "+91 9812345678",
    category: "ORDERS",
    issueType: "MISSING_ITEM",
    subject: "Missing Beverage Item from Food Parcel",
    description: "Ordered 2 Cold Coffees and 1 Paneer Wrap. The Paneer Wrap was missing from pickup parcel.",
    relatedOrderId: "ord_8815_uuid",
    canteenId: "canteens_axis_02",
    canteenName: "Maggi Hotspot",
    campusId: "cmp_axis_01",
    campusName: "PSIT Kanpur",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignedAdminId: "admin_super_01",
    assignedAdminName: "Super Admin",
    slaDueAt: new Date(Date.now() + 3600 * 1000 * 4).toISOString(),
    slaStatus: "ON_TRACK",
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    lastActivityAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
  },
  {
    id: "tck_1003",
    ticketNumber: "TCK-1003",
    userId: "usr_student_03",
    customerName: "Rohan Patel",
    customerPhone: "+91 9765432109",
    category: "REFUNDS",
    issueType: "REFUND_ISSUE",
    subject: "Wallet Refund Pending for Cancelled Order",
    description: "Order cancelled by vendor due to stockout, but ₹150 wallet credit has not reflected.",
    relatedOrderId: "ord_8820_uuid",
    canteenId: "canteens_axis_01",
    canteenName: "Axis Central Canteen",
    campusId: "cmp_axis_01",
    campusName: "PSIT Kanpur",
    priority: "HIGH",
    status: "WAITING_FOR_VENDOR",
    assignedAdminId: "admin_super_01",
    assignedAdminName: "Super Admin",
    slaDueAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    slaStatus: "BREACHED",
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    lastActivityAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
  {
    id: "tck_1004",
    ticketNumber: "TCK-1004",
    userId: "usr_vendor_01",
    customerName: "Verma Foods (Vendor)",
    customerPhone: "+91 9988776655",
    category: "VENDOR",
    issueType: "OTHER",
    subject: "Daily Settlement Discrepancy",
    description: "Daily settlement batch for Aug 20 shows ₹450 lower than gross canteen order totals.",
    canteenId: "canteens_axis_01",
    canteenName: "Axis Central Canteen",
    campusId: "cmp_axis_01",
    campusName: "PSIT Kanpur",
    priority: "MEDIUM",
    status: "OPEN",
    assignedAdminId: null,
    assignedAdminName: null,
    slaDueAt: new Date(Date.now() + 3600 * 1000 * 6).toISOString(),
    slaStatus: "ON_TRACK",
    createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    lastActivityAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
  },
];

const inMemoryMessages: Record<string, SupportMessageItem[]> = {
  tck_1001: [
    {
      id: "msg_101",
      ticketId: "tck_1001",
      senderId: "usr_student_01",
      senderName: "Aarav Sharma",
      senderType: "CUSTOMER",
      messageType: "CUSTOMER_MESSAGE",
      message: "₹240 debited via PhonePe UPI for Canteen Order #ORD-8812, but order status shows unpaid.",
      createdAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    },
  ],
  tck_1002: [
    {
      id: "msg_102",
      ticketId: "tck_1002",
      senderId: "usr_student_02",
      senderName: "Riya Verma",
      senderType: "CUSTOMER",
      messageType: "CUSTOMER_MESSAGE",
      message: "Ordered 2 Cold Coffees and 1 Paneer Wrap. The Paneer Wrap was missing from pickup parcel.",
      createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    },
    {
      id: "msg_103",
      ticketId: "tck_1002",
      senderId: "admin_super_01",
      senderName: "Super Admin",
      senderType: "ADMIN",
      messageType: "INTERNAL_NOTE",
      message: "Contacted vendor manager at Maggi Hotspot. They confirmed item was out of stock during pickup rush.",
      createdAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    },
  ],
};

/**
 * Calculate SLA Status (ON_TRACK, WARNING, BREACHED) from created_at and priority.
 */
function deriveSlaStatus(createdAt: string, priority: TicketPriority): SlaStatus {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / (3600 * 1000);
  let maxSlaHours = 24;

  if (priority === "CRITICAL") maxSlaHours = 2;
  else if (priority === "HIGH") maxSlaHours = 6;
  else if (priority === "MEDIUM") maxSlaHours = 12;

  if (ageHours > maxSlaHours) return "BREACHED";
  if (ageHours > maxSlaHours * 0.75) return "WARNING";
  return "ON_TRACK";
}

/**
 * Fetch Support Overview KPI stats.
 */
export async function fetchSupportOverviewStats(): Promise<SupportOverviewStats> {
  const tickets = await fetchSupportTicketsDirectory("ALL");
  const openTickets = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS" || t.status === "ESCALATED").length;
  const unassignedTickets = tickets.filter((t) => !t.assignedAdminId && t.status !== "RESOLVED" && t.status !== "CLOSED").length;
  const highPriority = tickets.filter((t) => (t.priority === "HIGH" || t.priority === "CRITICAL") && t.status !== "RESOLVED" && t.status !== "CLOSED").length;
  const criticalIssues = tickets.filter((t) => t.priority === "CRITICAL" && t.status !== "RESOLVED" && t.status !== "CLOSED").length;
  const waitingForCustomer = tickets.filter((t) => t.status === "WAITING_FOR_CUSTOMER").length;
  const waitingForVendor = tickets.filter((t) => t.status === "WAITING_FOR_VENDOR").length;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const resolvedToday = tickets.filter(
    (t) => (t.status === "RESOLVED" || t.status === "CLOSED") && t.resolvedAt && new Date(t.resolvedAt) >= startOfToday
  ).length;

  return {
    openTickets,
    unassignedTickets,
    highPriority,
    criticalIssues,
    waitingForCustomer,
    waitingForVendor,
    resolvedToday,
    avgResolutionTimeMins: 28,
  };
}

/**
 * Fetch Support Tickets Directory with queue filtering, search, and criteria matching.
 */
export async function fetchSupportTicketsDirectory(
  queue: SupportQueue = "ALL",
  search?: string,
  priorityFilter?: string,
  statusFilter?: string,
  categoryFilter?: string,
  campusFilter?: string,
  currentAdminId?: string
): Promise<SupportTicketItem[]> {
  let dbTickets: SupportTicketItem[] = [];

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*, users!support_tickets_user_id_fkey(full_name, phone), canteens(name), campuses(name)");

    if (!error && data && data.length > 0) {
      dbTickets = data.map((d: any) => {
        const priority = (d.priority || "MEDIUM") as TicketPriority;
        const createdAt = d.created_at || new Date().toISOString();
        return {
          id: d.id,
          ticketNumber: d.ticket_number || `TCK-${d.id.substring(0, 6).toUpperCase()}`,
          userId: d.user_id,
          customerName: d.users?.full_name || "GRABIT Student",
          customerPhone: maskSensitiveData(d.users?.phone || ""),
          category: (d.category || "OTHER") as TicketCategory,
          issueType: d.issue_type || "OTHER",
          subject: d.subject || "Support Query",
          description: d.description || "",
          relatedOrderId: d.related_order_id,
          canteenId: d.canteen_id,
          canteenName: d.canteens?.name,
          campusId: d.campus_id,
          campusName: d.campuses?.name,
          priority,
          status: (d.status || "OPEN") as TicketStatus,
          assignedAdminId: d.assigned_admin_id,
          assignedAdminName: d.assigned_admin_id ? "Super Admin" : null,
          slaDueAt: d.sla_due_at,
          slaStatus: d.sla_status || deriveSlaStatus(createdAt, priority),
          escalationReason: d.escalation_reason,
          resolution: d.resolution,
          resolvedAt: d.resolved_at,
          createdAt,
          updatedAt: d.updated_at || createdAt,
          lastActivityAt: d.updated_at || createdAt,
        };
      });
    }
  } catch {
    // DB fallback
  }

  let result = dbTickets.length > 0 ? dbTickets : [...inMemoryTickets];

  // Queue Partitioning Filter
  if (queue === "UNASSIGNED") {
    result = result.filter((t) => !t.assignedAdminId && t.status !== "RESOLVED" && t.status !== "CLOSED");
  } else if (queue === "MY_TICKETS" && currentAdminId) {
    result = result.filter((t) => t.assignedAdminId === currentAdminId);
  } else if (queue === "HIGH_PRIORITY") {
    result = result.filter((t) => t.priority === "HIGH" || t.priority === "CRITICAL");
  } else if (queue === "CRITICAL") {
    result = result.filter((t) => t.priority === "CRITICAL");
  } else if (queue === "WAITING_FOR_CUSTOMER") {
    result = result.filter((t) => t.status === "WAITING_FOR_CUSTOMER");
  } else if (queue === "WAITING_FOR_VENDOR") {
    result = result.filter((t) => t.status === "WAITING_FOR_VENDOR");
  } else if (queue === "SLA_BREACHED") {
    result = result.filter((t) => t.slaStatus === "BREACHED");
  } else if (queue === "RESOLVED") {
    result = result.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");
  }

  // Filters
  if (priorityFilter && priorityFilter !== "ALL") {
    result = result.filter((t) => t.priority === priorityFilter);
  }
  if (statusFilter && statusFilter !== "ALL") {
    result = result.filter((t) => t.status === statusFilter);
  }
  if (categoryFilter && categoryFilter !== "ALL") {
    result = result.filter((t) => t.category === categoryFilter);
  }
  if (campusFilter && campusFilter !== "ALL") {
    result = result.filter((t) => t.campusId === campusFilter);
  }

  // Search
  if (search?.trim()) {
    const s = search.trim().toLowerCase();
    result = result.filter(
      (t) =>
        t.ticketNumber.toLowerCase().includes(s) ||
        t.subject.toLowerCase().includes(s) ||
        t.customerName.toLowerCase().includes(s) ||
        (t.relatedOrderId && t.relatedOrderId.toLowerCase().includes(s)) ||
        (t.description && t.description.toLowerCase().includes(s))
    );
  }

  return result;
}

/**
 * Fetch detailed Support Ticket workspace data by ID.
 */
export async function fetchSupportTicketDetail(
  ticketId: string,
  isAdmin = true
): Promise<{ ticket: SupportTicketItem; messages: SupportMessageItem[] } | null> {
  const tickets = await fetchSupportTicketsDirectory("ALL");
  const ticket = tickets.find((t) => t.id === ticketId);

  if (!ticket) return null;

  let messages = inMemoryMessages[ticketId] || [];
  if (!isAdmin) {
    messages = messages.filter((m) => m.messageType !== "INTERNAL_NOTE");
  }

  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("support_ticket_messages")
      .select("*, users(full_name)")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (!isAdmin) {
      query = query.neq("message_type", "INTERNAL_NOTE");
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      messages = data.map((m: any) => ({
        id: m.id,
        ticketId: m.ticket_id,
        senderId: m.sender_id,
        senderName: m.users?.full_name || (m.sender_type === "ADMIN" ? "Super Admin" : "User"),
        senderType: m.sender_type,
        messageType: m.message_type,
        message: m.message,
        attachments: m.attachments || [],
        createdAt: m.created_at,
      }));
    }
  } catch {
    // Fallback
  }

  return { ticket, messages };
}

/**
 * Server-authoritative Support Ticket Action (Assign, Priority, Status, Escalate, Resolve).
 */
export async function updateSupportTicketAction({
  adminId,
  ticketId,
  action,
  payload,
  reason,
}: {
  adminId: string;
  ticketId: string;
  action: "assign" | "priority" | "status" | "escalate" | "resolve" | "reopen";
  payload?: any;
  reason?: string;
}): Promise<{ ok: boolean; error?: string; ticket?: SupportTicketItem }> {
  try {
    const tickets = await fetchSupportTicketsDirectory("ALL");
    const existing = tickets.find((t) => t.id === ticketId);

    if (!existing) {
      return { ok: false, error: `Support ticket '${ticketId}' not found.` };
    }

    const now = new Date().toISOString();
    const updates: Partial<SupportTicketItem> = {
      updatedAt: now,
      lastActivityAt: now,
    };

    let auditAction = "support_ticket_updated";

    if (action === "assign") {
      const targetAdminId = payload?.assignedAdminId || adminId;
      updates.assignedAdminId = targetAdminId;
      updates.assignedAdminName = "Super Admin";
      if (existing.status === "OPEN") updates.status = "IN_PROGRESS";
      auditAction = existing.assignedAdminId ? "support_ticket_reassigned" : "support_ticket_assigned";
    } else if (action === "priority") {
      if (!payload?.priority) return { ok: false, error: "Missing required priority value." };
      updates.priority = payload.priority as TicketPriority;
      auditAction = "support_ticket_priority_changed";
    } else if (action === "status") {
      if (!payload?.status) return { ok: false, error: "Missing required status value." };
      updates.status = payload.status as TicketStatus;
      auditAction = "support_ticket_status_changed";
    } else if (action === "escalate") {
      if (!reason?.trim()) return { ok: false, error: "A mandatory explanation reason is required when escalating a support ticket." };
      updates.status = "ESCALATED";
      updates.priority = "HIGH";
      updates.escalationReason = reason.trim();
      auditAction = "support_ticket_escalated";
    } else if (action === "resolve") {
      if (!payload?.resolution?.trim()) {
        return { ok: false, error: "A resolution explanation is mandatory when resolving a support ticket." };
      }
      updates.status = "RESOLVED";
      updates.resolution = payload.resolution.trim();
      updates.resolvedAt = now;
      auditAction = "support_ticket_resolved";
    } else if (action === "reopen") {
      updates.status = "IN_PROGRESS";
      updates.resolution = null;
      updates.resolvedAt = null;
      auditAction = "support_ticket_status_changed";
    }

    // Update in-memory fallback
    const idx = inMemoryTickets.findIndex((t) => t.id === ticketId);
    if (idx !== -1) {
      inMemoryTickets[idx] = { ...inMemoryTickets[idx], ...updates };
    }

    try {
      const supabase = getSupabaseAdminClient();
      await supabase
        .from("support_tickets")
        .update({
          assigned_admin_id: updates.assignedAdminId ?? existing.assignedAdminId,
          priority: updates.priority ?? existing.priority,
          status: updates.status ?? existing.status,
          escalation_reason: updates.escalationReason ?? existing.escalationReason,
          resolution: updates.resolution ?? existing.resolution,
          resolved_at: updates.resolvedAt ?? existing.resolvedAt,
          updated_at: now,
        })
        .eq("id", ticketId);
    } catch {
      // Non-blocking fallback
    }

    await recordSuperAdminAction({
      adminId,
      action: auditAction,
      module: "System",
      targetType: "SYSTEM",
      targetId: ticketId,
      severity: action === "escalate" ? "HIGH" : "MEDIUM",
      previousState: { status: existing.status, priority: existing.priority, assignedAdminId: existing.assignedAdminId },
      newState: { status: updates.status ?? existing.status, priority: updates.priority ?? existing.priority },
      reason: reason || `Performed ${action} on support ticket ${ticketId}`,
      metadata: { ticketNumber: existing.ticketNumber, category: existing.category },
    });

    return {
      ok: true,
      ticket: { ...existing, ...updates },
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Failed to execute support ticket action." };
  }
}

/**
 * Add Message or Internal Admin Note to Support Ticket.
 */
export async function addSupportTicketMessage({
  adminId,
  ticketId,
  message,
  messageType = "CUSTOMER_MESSAGE",
}: {
  adminId: string;
  ticketId: string;
  message: string;
  messageType?: "CUSTOMER_MESSAGE" | "INTERNAL_NOTE";
}): Promise<{ ok: boolean; error?: string; messageItem?: SupportMessageItem }> {
  if (!message?.trim()) {
    return { ok: false, error: "Message content cannot be empty." };
  }

  const now = new Date().toISOString();
  const newMessage: SupportMessageItem = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ticketId,
    senderId: adminId,
    senderName: "Super Admin",
    senderType: "ADMIN",
    messageType,
    message: message.trim(),
    createdAt: now,
  };

  if (!inMemoryMessages[ticketId]) {
    inMemoryMessages[ticketId] = [];
  }
  inMemoryMessages[ticketId].push(newMessage);

  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from("support_ticket_messages").insert({
      ticket_id: ticketId,
      sender_id: adminId,
      sender_type: "ADMIN",
      message_type: messageType,
      message: message.trim(),
      created_at: now,
    });
  } catch {
    // Non-blocking fallback
  }

  await recordSuperAdminAction({
    adminId,
    action: messageType === "INTERNAL_NOTE" ? "support_internal_note_added" : "support_customer_reply_sent",
    module: "System",
    targetType: "SYSTEM",
    targetId: ticketId,
    severity: "LOW",
    reason: messageType === "INTERNAL_NOTE" ? "Added internal admin investigation note" : "Sent reply to customer",
  });

  return { ok: true, messageItem: newMessage };
}
