"use client";

interface SupportFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  onReset: () => void;
  onExport: () => void;
  exporting?: boolean;
}

export function SupportFilterBar({
  search,
  setSearch,
  priorityFilter,
  setPriorityFilter,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  onReset,
  onExport,
  exporting,
}: SupportFilterBarProps) {
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
            placeholder="Search by Ticket ID, Order #, Customer, or Vendor..."
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

        {/* Filter Selects Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* Priority Select */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="WAITING_FOR_CUSTOMER">WAITING_FOR_CUSTOMER</option>
            <option value="WAITING_FOR_VENDOR">WAITING_FOR_VENDOR</option>
            <option value="ESCALATED">ESCALATED</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          {/* Category Select */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Categories</option>
            <option value="PAYMENTS">Payments</option>
            <option value="ORDERS">Orders</option>
            <option value="REFUNDS">Refunds</option>
            <option value="VENDOR">Vendor</option>
            <option value="DELIVERY">Delivery / Pickup</option>
            <option value="ACCOUNT">Account</option>
            <option value="TECHNICAL">App / Technical</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="px-3 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-zinc-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            title="Reset filters"
          >
            <span className="material-icons text-xs">restart_alt</span>
            Reset
          </button>

          <button
            onClick={onExport}
            disabled={exporting}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            {exporting ? (
              <span className="material-icons animate-spin text-xs">sync</span>
            ) : (
              <span className="material-icons text-xs">download</span>
            )}
            CSV Export
          </button>
        </div>
      </div>
    </div>
  );
}
