"use client";

import type { SupportTicketItem } from "@/lib/supabase/superadmin_support";

interface SupportTicketTableProps {
  tickets: SupportTicketItem[];
  onSelectTicket: (ticket: SupportTicketItem) => void;
  loading?: boolean;
}

export function SupportTicketTable({
  tickets,
  onSelectTicket,
  loading,
}: SupportTicketTableProps) {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-rose-950/90 text-rose-300 border-rose-800 animate-pulse font-bold";
      case "HIGH":
        return "bg-orange-950/80 text-orange-300 border-orange-800 font-semibold";
      case "MEDIUM":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "LOW":
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-950/80 text-blue-300 border-blue-800";
      case "IN_PROGRESS":
        return "bg-orange-950/80 text-orange-300 border-orange-800";
      case "WAITING_FOR_CUSTOMER":
      case "WAITING_FOR_VENDOR":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "ESCALATED":
        return "bg-rose-950/90 text-rose-300 border-rose-800 font-bold";
      case "RESOLVED":
      case "CLOSED":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getSlaBadge = (slaStatus: string) => {
    switch (slaStatus) {
      case "BREACHED":
        return "bg-rose-950 text-rose-400 border-rose-800 font-bold";
      case "WARNING":
        return "bg-amber-950 text-amber-400 border-amber-800 font-medium";
      case "ON_TRACK":
      default:
        return "bg-emerald-950 text-emerald-400 border-emerald-800";
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-12 bg-zinc-950/60 border border-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center shadow-md">
        <span className="material-icons text-5xl text-zinc-600 mb-3">support_agent</span>
        <h3 className="text-lg font-semibold text-zinc-200">No Support Tickets Found</h3>
        <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
          No support tickets match your search query or selected queue filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
              <th className="py-3.5 px-4">Ticket # & Subject</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Campus</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">SLA</th>
              <th className="py-3.5 px-4">Assigned Admin</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {tickets.map((t) => (
              <tr
                key={t.id}
                onClick={() => onSelectTicket(t)}
                className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-orange-400 font-bold">{t.ticketNumber}</span>
                    {t.relatedOrderId && (
                      <span className="text-[10px] text-zinc-500 font-mono">
                        (Order: {t.relatedOrderId.substring(0, 8)})
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-zinc-100 line-clamp-1 mt-0.5">{t.subject}</div>
                </td>

                <td className="py-3 px-4 whitespace-nowrap font-medium text-zinc-300">{t.customerName}</td>

                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {t.category}
                  </span>
                </td>

                <td className="py-3 px-4 whitespace-nowrap text-zinc-400">{t.campusName || "N/A"}</td>

                <td className="py-3 px-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase border ${getPriorityBadge(t.priority)}`}>
                    {t.priority}
                  </span>
                </td>

                <td className="py-3 px-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(t.status)}`}>
                    {t.status}
                  </span>
                </td>

                <td className="py-3 px-4 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase ${getSlaBadge(t.slaStatus)}`}>
                    {t.slaStatus}
                  </span>
                </td>

                <td className="py-3 px-4 whitespace-nowrap text-zinc-300">
                  {t.assignedAdminName || <span className="text-zinc-500 font-italic">Unassigned</span>}
                </td>

                <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTicket(t);
                    }}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                  >
                    Workspace
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="block md:hidden divide-y divide-zinc-800">
        {tickets.map((t) => (
          <div
            key={t.id}
            onClick={() => onSelectTicket(t)}
            className="p-4 hover:bg-zinc-800/30 transition-colors space-y-2.5 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-orange-400 font-bold text-xs">{t.ticketNumber}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadge(t.status)}`}>
                {t.status}
              </span>
            </div>

            <div className="font-bold text-sm text-zinc-100">{t.subject}</div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800/60">
              <div>
                <span className="text-zinc-500">Customer:</span> {t.customerName}
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase ${getSlaBadge(t.slaStatus)}`}>
                {t.slaStatus}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
