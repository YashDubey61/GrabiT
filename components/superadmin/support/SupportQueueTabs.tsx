"use client";

import type { SupportQueue } from "@/lib/supabase/superadmin_support";

interface SupportQueueTabsProps {
  selectedQueue: SupportQueue;
  onSelectQueue: (queue: SupportQueue) => void;
  queueCounts: Record<string, number>;
}

const QUEUES: { id: SupportQueue; label: string; icon: string }[] = [
  { id: "ALL", label: "All Tickets", icon: "confirmation_number" },
  { id: "UNASSIGNED", label: "Unassigned", icon: "person_off" },
  { id: "MY_TICKETS", label: "My Tickets", icon: "assignment_ind" },
  { id: "HIGH_PRIORITY", label: "High Priority", icon: "warning" },
  { id: "CRITICAL", label: "Critical", icon: "error" },
  { id: "WAITING_FOR_CUSTOMER", label: "Waiting for Customer", icon: "hourglass_empty" },
  { id: "WAITING_FOR_VENDOR", label: "Waiting for Vendor", icon: "storefront" },
  { id: "SLA_BREACHED", label: "SLA Breached", icon: "alarm" },
  { id: "RESOLVED", label: "Resolved / Closed", icon: "task_alt" },
];

export function SupportQueueTabs({
  selectedQueue,
  onSelectQueue,
  queueCounts,
}: SupportQueueTabsProps) {
  return (
    <div className="overflow-x-auto mb-6 pb-2 border-b border-zinc-800">
      <div className="flex items-center gap-2 min-w-max">
        {QUEUES.map((q) => {
          const isSelected = selectedQueue === q.id;
          const count = queueCounts[q.id] || 0;

          return (
            <button
              key={q.id}
              onClick={() => onSelectQueue(q.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                isSelected
                  ? "bg-orange-600 text-white shadow-md"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <span className="material-icons text-sm">{q.icon}</span>
              <span>{q.label}</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isSelected ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
