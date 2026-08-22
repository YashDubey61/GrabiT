"use client";

import type { UserItem, UserRole } from "@/lib/supabase/superadmin_users";

interface UserDirectoryTableProps {
  users: UserItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectUser: (user: UserItem) => void;
  onChangeRole: (user: UserItem, targetRole?: UserRole) => void;
  onChangeStatus: (user: UserItem) => void;
  isLoading?: boolean;
}

export function UserDirectoryTable({
  users,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onSelectUser,
  onChangeRole,
  onChangeStatus,
  isLoading = false,
}: UserDirectoryTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-border/40 rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 w-full bg-border/20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface-elevated p-12 text-center">
        <span className="material-symbols-outlined text-[48px] text-muted mb-3">
          no_accounts
        </span>
        <h3 className="font-display text-body font-bold text-foreground mb-1">
          No Users Found
        </h3>
        <p className="font-display text-caption text-muted max-w-sm">
          No accounts matched your search or filter criteria. Try adjusting your query.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Dense Table */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-sm">
        <table className="w-full text-left text-caption">
          <thead className="border-b border-border bg-background/50 font-display text-[11px] font-bold uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">User & Contact</th>
              <th className="px-4 py-3">GRABIT ID</th>
              <th className="px-4 py-3">Role Management</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Campus / Canteen</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {users.map((user) => {
              const displayName = user.fullName || user.phone || "Unnamed Account";

              return (
                <tr key={user.id} className="transition-colors hover:bg-background/40">
                  {/* User Profile & Email */}
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => onSelectUser(user)}
                      className="flex items-center gap-3 text-left group min-w-0"
                    >
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border bg-background flex items-center justify-center font-bold text-primary">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                        ) : (
                          displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-body-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {displayName}
                        </div>
                        <div className="text-[11px] text-muted truncate">
                          {user.email || user.phone}
                        </div>
                      </div>
                    </button>
                  </td>

                  {/* GRABIT ID */}
                  <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-foreground whitespace-nowrap">
                    <span className="bg-background border border-border/80 px-2 py-1 rounded-md text-primary">
                      {user.grabitUserId || `GRB-${user.id.slice(0, 6).toUpperCase()}`}
                    </span>
                  </td>

                  {/* Role Selector Control */}
                  <td className="px-4 py-3.5">
                    <select
                      value={user.role}
                      onChange={(e) => {
                        const targetRole = e.target.value as UserRole;
                        if (targetRole !== user.role) {
                          onChangeRole(user, targetRole);
                        }
                      }}
                      className={`rounded-xl px-2.5 py-1.5 font-display text-[11px] font-extrabold border cursor-pointer focus:outline-none transition-all ${
                        user.role === "admin"
                          ? "bg-purple-950/60 text-purple-300 border-purple-800/80 hover:border-purple-500"
                          : user.role === "vendor"
                            ? "bg-amber-950/60 text-amber-300 border-amber-800/80 hover:border-amber-500"
                            : "bg-blue-950/60 text-blue-300 border-blue-800/80 hover:border-blue-500"
                      }`}
                    >
                      <option value="student" className="bg-zinc-900 text-zinc-100">Student</option>
                      <option value="vendor" className="bg-zinc-900 text-zinc-100">Vendor Manager</option>
                      <option value="admin" className="bg-zinc-900 text-zinc-100">Super Admin</option>
                    </select>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-display text-[11px] font-extrabold ${
                        user.accountStatus === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      <span className="capitalize">{user.accountStatus}</span>
                    </span>
                  </td>

                  {/* Campus / Canteen */}
                  <td className="px-4 py-3.5 font-display text-muted">
                    {user.canteenName ? (
                      <div className="font-bold text-foreground truncate max-w-[140px]">{user.canteenName}</div>
                    ) : user.campusName ? (
                      <div className="text-muted truncate max-w-[140px]">{user.campusName}</div>
                    ) : (
                      <span className="text-muted/60">—</span>
                    )}
                  </td>

                  {/* Joined Date */}
                  <td className="px-4 py-3.5 font-display text-muted text-[11px] whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectUser(user)}
                        title="View Details"
                        className="rounded-lg p-1.5 text-muted hover:bg-background hover:text-foreground transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onChangeRole(user)}
                        title="Modify Role"
                        className="rounded-lg p-1.5 text-muted hover:bg-background hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onChangeStatus(user)}
                        title="Change Account Status"
                        className="rounded-lg p-1.5 text-muted hover:bg-background hover:text-rose-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">block</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile User Cards */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {users.map((user) => {
          const displayName = user.fullName || user.phone || "Unnamed Account";

          return (
            <div
              key={user.id}
              className="rounded-2xl border border-border bg-surface-elevated p-4 space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onSelectUser(user)}
                  className="flex items-center gap-3 text-left min-w-0"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-background flex items-center justify-center font-bold text-primary">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-body-sm font-bold text-foreground truncate">
                      {displayName}
                    </div>
                    <div className="font-mono text-[11px] text-primary truncate">
                      {user.grabitUserId || `GRB-${user.id.slice(0, 6).toUpperCase()}`}
                    </div>
                  </div>
                </button>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-display text-[10px] font-extrabold ${
                    user.accountStatus === "active"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {user.accountStatus}
                </span>
              </div>

              {/* Mobile Role Dropdown */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60 text-[12px] font-display">
                <span className="text-muted font-semibold">Account Role:</span>
                <select
                  value={user.role}
                  onChange={(e) => {
                    const targetRole = e.target.value as UserRole;
                    if (targetRole !== user.role) {
                      onChangeRole(user, targetRole);
                    }
                  }}
                  className="rounded-xl px-2.5 py-1 font-display text-[11px] font-extrabold border bg-background text-foreground focus:outline-none"
                >
                  <option value="student">Student</option>
                  <option value="vendor">Vendor Manager</option>
                  <option value="admin">Super Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-[11px] font-display text-muted">
                <span>{user.email || user.phone}</span>
                <span>{user.canteenName || user.campusName || "Global"}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectUser(user)}
                  className="flex-1 rounded-xl border border-border bg-background py-2 font-display text-caption font-bold text-foreground hover:bg-surface transition-colors"
                >
                  View Profile
                </button>
                <button
                  type="button"
                  onClick={() => onChangeRole(user)}
                  className="rounded-xl border border-border bg-background p-2 text-muted hover:text-primary transition-colors"
                  title="Modify Role"
                >
                  <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeStatus(user)}
                  className="rounded-xl border border-border bg-background p-2 text-muted hover:text-rose-400 transition-colors"
                  title="Status"
                >
                  <span className="material-symbols-outlined text-[18px]">block</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-border/60 pt-4 px-1">
        <span className="font-display text-caption text-muted">
          Showing {users.length} of {totalCount} accounts (Page {currentPage} of {totalPages})
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="rounded-xl border border-border bg-surface-elevated px-3 py-1.5 font-display text-caption font-bold text-foreground disabled:opacity-40 disabled:pointer-events-none hover:border-primary/40 transition-colors"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="rounded-xl border border-border bg-surface-elevated px-3 py-1.5 font-display text-caption font-bold text-foreground disabled:opacity-40 disabled:pointer-events-none hover:border-primary/40 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
