"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  SupportTicketItem,
  SupportMessageItem,
} from "@/lib/supabase/superadmin_support";

interface SupportTicketWorkspaceDrawerProps {
  ticket: SupportTicketItem | null;
  isOpen: boolean;
  onClose: () => void;
  onTicketAction: (action: string, payload?: any, reason?: string) => Promise<boolean>;
  onSendMessage: (message: string, messageType: "CUSTOMER_MESSAGE" | "INTERNAL_NOTE") => Promise<boolean>;
}

export function SupportTicketWorkspaceDrawer({
  ticket,
  isOpen,
  onClose,
  onTicketAction,
  onSendMessage,
}: SupportTicketWorkspaceDrawerProps) {
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [messages, setMessages] = useState<SupportMessageItem[]>([]);
  const [replyText, setReplyText] = useState("");
  const [msgTypeTab, setMsgTypeTab] = useState<"CUSTOMER_MESSAGE" | "INTERNAL_NOTE">("CUSTOMER_MESSAGE");

  const [submitting, setSubmitting] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionText, setResolutionText] = useState("");
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticket || !isOpen) return;

    let isMounted = true;
    async function loadWorkspaceData() {
      try {
        setLoadingMessages(true);
        const res = await fetch(`/api/superadmin/support/${ticket?.id}`);
        const json = await res.json();
        if (isMounted && json.ok && json.data) {
          setMessages(json.data.messages || []);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    }

    loadWorkspaceData();
    return () => {
      isMounted = false;
    };
  }, [ticket, isOpen]);

  if (!isOpen || !ticket) return null;

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const success = await onSendMessage(replyText, msgTypeTab);
      if (success) {
        setReplyText("");
        // Reload messages
        const res = await fetch(`/api/superadmin/support/${ticket.id}`);
        const json = await res.json();
        if (json.ok && json.data) setMessages(json.data.messages || []);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to post message.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveSubmit = async () => {
    if (!resolutionText.trim()) {
      setError("A resolution explanation is mandatory when resolving a support ticket.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const success = await onTicketAction("resolve", { resolution: resolutionText });
      if (success) {
        setResolveModalOpen(false);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to resolve ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalateSubmit = async () => {
    if (!escalateReason.trim()) {
      setError("A mandatory explanation reason is required when escalating a support ticket.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const success = await onTicketAction("escalate", undefined, escalateReason);
      if (success) {
        setEscalateModalOpen(false);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to escalate ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm p-0">
      <div className="bg-zinc-900 border-l border-zinc-800 max-w-3xl w-full h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/40 border border-orange-800/60 px-2.5 py-0.5 rounded">
                {ticket.ticketNumber}
              </span>
              <span className="text-xs font-semibold text-zinc-300 uppercase bg-zinc-800 px-2 py-0.5 rounded">
                {ticket.category}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{ticket.subject}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
            <span className="material-icons text-sm text-rose-400">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Action Controls & Deep Links */}
        <div className="flex items-center justify-between gap-2 flex-wrap bg-zinc-950 p-3 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-2">
            {/* Status Change */}
            <select
              value={ticket.status}
              onChange={(e) => onTicketAction("status", { status: e.target.value })}
              className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs font-bold text-orange-400 focus:outline-none"
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="WAITING_FOR_CUSTOMER">WAITING_FOR_CUSTOMER</option>
              <option value="WAITING_FOR_VENDOR">WAITING_FOR_VENDOR</option>
              <option value="ESCALATED">ESCALATED</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>

            {/* Priority Change */}
            <select
              value={ticket.priority}
              onChange={(e) => onTicketAction("priority", { priority: e.target.value })}
              className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs font-bold text-zinc-300 focus:outline-none"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          {/* Deep Links */}
          <div className="flex items-center gap-1.5">
            {ticket.relatedOrderId && (
              <Link
                href={`/superadmin/operations?orderId=${ticket.relatedOrderId}`}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-medium"
              >
                Order Ops
              </Link>
            )}
            <Link
              href={`/superadmin/disputes?ticketId=${ticket.id}`}
              className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded text-xs font-semibold"
            >
              Dispute & Refund
            </Link>
          </div>
        </div>

        {/* Customer & Order Context Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Customer */}
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1">
            <div className="text-[10px] uppercase font-semibold text-zinc-500">Customer Details</div>
            <div className="font-bold text-white">{ticket.customerName}</div>
            <div className="text-zinc-400 font-mono">{ticket.customerPhone || "Phone masked"}</div>
            <div className="text-zinc-400">Campus: {ticket.campusName || "PSIT Kanpur"}</div>
          </div>

          {/* Canteen & SLA */}
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1">
            <div className="text-[10px] uppercase font-semibold text-zinc-500">Canteen & SLA Status</div>
            <div className="font-bold text-white">{ticket.canteenName || "Campus Storefront"}</div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-zinc-400">SLA Due:</span>
              <span className="font-mono text-emerald-400 font-bold">{ticket.slaStatus}</span>
            </div>
          </div>
        </div>

        {/* Ticket Description */}
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
          <div className="text-[10px] uppercase font-semibold text-zinc-500">Issue Description</div>
          <p className="text-xs text-zinc-200 leading-relaxed">{ticket.description}</p>
        </div>

        {/* Message & Internal Notes Timeline */}
        <div className="flex-1 space-y-3 overflow-y-auto max-h-64 pr-1">
          <div className="text-xs font-bold text-zinc-400 uppercase">Communication Timeline</div>
          {loadingMessages ? (
            <div className="space-y-2">
              <div className="h-12 bg-zinc-950 rounded animate-pulse" />
              <div className="h-12 bg-zinc-950 rounded animate-pulse" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-xs text-zinc-500 py-4 text-center">No timeline messages recorded.</div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  m.messageType === "INTERNAL_NOTE"
                    ? "bg-amber-950/30 border-amber-900/60 text-amber-200"
                    : m.senderType === "ADMIN"
                    ? "bg-orange-950/30 border-orange-900/60 text-orange-200"
                    : "bg-zinc-950 border-zinc-800 text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold uppercase">
                    {m.messageType === "INTERNAL_NOTE" ? "🔒 INTERNAL ADMIN NOTE" : m.senderName}
                  </span>
                  <span className="font-mono opacity-60">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="leading-relaxed">{m.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Message Post / Reply Form */}
        <form onSubmit={handlePostMessage} className="space-y-3 border-t border-zinc-800 pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMsgTypeTab("CUSTOMER_MESSAGE")}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                msgTypeTab === "CUSTOMER_MESSAGE" ? "bg-orange-600 text-white" : "bg-zinc-950 text-zinc-400"
              }`}
            >
              Reply to Customer
            </button>
            <button
              type="button"
              onClick={() => setMsgTypeTab("INTERNAL_NOTE")}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                msgTypeTab === "INTERNAL_NOTE" ? "bg-amber-950 text-amber-300 border border-amber-800" : "bg-zinc-950 text-zinc-400"
              }`}
            >
              Add Internal Admin Note
            </button>
          </div>

          <textarea
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={
              msgTypeTab === "INTERNAL_NOTE"
                ? "Add internal investigation note (hidden from customer)..."
                : "Type response to customer..."
            }
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEscalateModalOpen(true);
                  setEscalateReason("");
                }}
                className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold rounded transition-colors"
              >
                Escalate
              </button>

              <button
                type="button"
                onClick={() => {
                  setResolveModalOpen(true);
                  setResolutionText("");
                }}
                className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-bold rounded transition-colors"
              >
                Resolve Ticket
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting || !replyText.trim()}
              className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold rounded text-xs transition-colors shadow-md"
            >
              {msgTypeTab === "INTERNAL_NOTE" ? "Save Note" : "Send Reply"}
            </button>
          </div>
        </form>

        {/* Resolve Modal */}
        {resolveModalOpen && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl space-y-3">
            <div className="text-xs font-bold text-emerald-300 uppercase">Resolve Support Ticket</div>
            <textarea
              rows={2}
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="Mandatory explanation of resolution provided..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setResolveModalOpen(false)} className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs">
                Cancel
              </button>
              <button onClick={handleResolveSubmit} className="px-4 py-1 bg-emerald-600 text-white font-bold text-xs">
                Confirm Resolution
              </button>
            </div>
          </div>
        )}

        {/* Escalate Modal */}
        {escalateModalOpen && (
          <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl space-y-3">
            <div className="text-xs font-bold text-rose-300 uppercase">Escalate Support Ticket</div>
            <textarea
              rows={2}
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              placeholder="Mandatory explanation for escalating ticket..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEscalateModalOpen(false)} className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs">
                Cancel
              </button>
              <button onClick={handleEscalateSubmit} className="px-4 py-1 bg-rose-600 text-white font-bold text-xs">
                Confirm Escalation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
