"use client";

import type { AuditModule, AuditSeverity } from "@/lib/supabase/superadmin_audit";

interface AuditFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  moduleFilter: string;
  setModuleFilter: (val: string) => void;
  actionFilter: string;
  setActionFilter: (val: string) => void;
  severityFilter: string;
  setSeverityFilter: (val: string) => void;
  dateRangeFilter: string;
  setDateRangeFilter: (val: string) => void;
  onReset: () => void;
  onExport: () => void;
  exporting?: boolean;
}

const MODULES: { label: string; value: AuditModule | "ALL" }[] = [
  { label: "All Modules", value: "ALL" },
  { label: "Users", value: "Users" },
  { label: "Vendors", value: "Vendors" },
  { label: "Risk", value: "Risk" },
  { label: "Disputes", value: "Disputes" },
  { label: "Finance", value: "Finance" },
  { label: "Payments", value: "Payments" },
  { label: "Orders", value: "Orders" },
  { label: "Security", value: "Security" },
  { label: "System", value: "System" },
];

const SEVERITIES: { label: string; value: AuditSeverity | "ALL" }[] = [
  { label: "All Severities", value: "ALL" },
  { label: "INFO", value: "INFO" },
  { label: "LOW", value: "LOW" },
  { label: "MEDIUM", value: "MEDIUM" },
  { label: "HIGH", value: "HIGH" },
  { label: "CRITICAL", value: "CRITICAL" },
];

const ACTIONS = [
  { label: "All Actions", value: "ALL" },
  { label: "User Role Changed", value: "user_role_changed" },
  { label: "User Status Changed", value: "user_status_changed" },
  { label: "Application Approved", value: "application_approved" },
  { label: "Application Rejected", value: "application_rejected" },
  { label: "KYC Verified", value: "kyc_verified" },
  { label: "KYC Rejected", value: "kyc_rejected" },
  { label: "Vendor Suspended", value: "vendor_suspended" },
  { label: "Risk Case Resolved", value: "risk_case_resolved" },
  { label: "Risk Case Updated", value: "risk_case_updated" },
  { label: "Risk Note Added", value: "risk_note_added" },
  { label: "Dispute Resolved", value: "dispute_resolved" },
  { label: "Dispute Status Changed", value: "dispute_status_changed" },
  { label: "Refund Processed", value: "refund_processed" },
  { label: "Credential Reset", value: "credential_reset" },
];

const DATE_RANGES = [
  { label: "All Time", value: "ALL" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
];

export function AuditFilterBar({
  search,
  setSearch,
  moduleFilter,
  setModuleFilter,
  actionFilter,
  setActionFilter,
  severityFilter,
  setSeverityFilter,
  dateRangeFilter,
  setDateRangeFilter,
  onReset,
  onExport,
  exporting,
}: AuditFilterBarProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Actor, Target ID, Action, or Reason..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              clear
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-wrap">
          {/* Module Select */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
          >
            {MODULES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Action Select */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>

          {/* Severity Select */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
          >
            {SEVERITIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Date Range Select */}
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
          >
            {DATE_RANGES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="px-3 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            title="Reset all filters"
          >
            <span className="material-icons text-xs">restart_alt</span>
            Reset
          </button>

          <button
            onClick={onExport}
            disabled={exporting}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {exporting ? (
              <span className="material-icons animate-spin text-xs">sync</span>
            ) : (
              <span className="material-icons text-xs">download</span>
            )}
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
