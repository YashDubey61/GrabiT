"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserOverviewCards } from "@/components/superadmin/users/UserOverviewCards";
import { UserFilterBar } from "@/components/superadmin/users/UserFilterBar";
import { UserDirectoryTable } from "@/components/superadmin/users/UserDirectoryTable";
import { UserDetailModal } from "@/components/superadmin/users/UserDetailModal";
import { UserEditRoleModal } from "@/components/superadmin/users/UserEditRoleModal";
import { UserStatusModal } from "@/components/superadmin/users/UserStatusModal";
import type {
  UserItem,
  UserRole,
  UserManagementStats,
} from "@/lib/supabase/superadmin_users";

export default function SuperAdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [stats, setStats] = useState<UserManagementStats>({
    totalUsers: 0,
    activeUsers: 0,
    studentsCount: 0,
    vendorsCount: 0,
    adminsCount: 0,
    suspendedCount: 0,
  });
  const [users, setUsers] = useState<UserItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Modal States
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserItem | null>(null);
  const [selectedUserForRole, setSelectedUserForRole] = useState<{ user: UserItem; initialRole?: UserRole } | null>(null);
  const [selectedUserForStatus, setSelectedUserForStatus] = useState<UserItem | null>(null);

  // Fetch users & stats from API
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", currentPage.toString());
      params.set("pageSize", pageSize.toString());

      const res = await fetch(`/api/superadmin/users?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setStats(data.stats);
        setUsers(data.users);
        setTotalCount(data.totalCount);
      } else {
        setErrorMsg(data.error || "Unable to load users directory.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load user records from database.");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time Supabase Postgres Sync on `users` table
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("superadmin_users_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => {
          loadData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const handleResetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const showToast = (message: string) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-white font-display text-caption font-bold shadow-2xl animate-in slide-in-from-top-4">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[28px]">
              manage_accounts
            </span>
            <h1 className="font-display text-display font-extrabold tracking-tight text-foreground">
              User & Role Management
            </h1>
          </div>
          <p className="font-display text-caption text-muted mt-1">
            Centralized control center for student, vendor manager, and super admin account authorizations.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2 font-display text-caption font-bold text-foreground hover:border-primary/40 disabled:opacity-50 transition-colors"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>
            refresh
          </span>
          <span>{loading ? "Refreshing..." : "Refresh Data"}</span>
        </button>
      </div>

      {/* Overview Statistics Cards */}
      <UserOverviewCards stats={stats} isLoading={loading} />

      {/* Filter & Search Bar */}
      <UserFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        roleFilter={roleFilter}
        onRoleFilterChange={(val) => {
          setRoleFilter(val);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setCurrentPage(1);
        }}
        onResetFilters={handleResetFilters}
      />

      {/* Error Banner State if API Request Failed */}
      {errorMsg ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-danger/40 bg-danger/10 p-12 text-center space-y-4">
          <span className="material-symbols-outlined text-[48px] text-danger">
            error
          </span>
          <div>
            <h3 className="font-display text-body font-bold text-foreground mb-1">
              Unable to load users
            </h3>
            <p className="font-display text-caption text-muted max-w-md">
              {errorMsg}
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-display text-caption font-bold text-on-primary hover:bg-primary-hover transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span>Retry</span>
          </button>
        </div>
      ) : (
        /* User Directory Table / Mobile List */
        <UserDirectoryTable
          users={users}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={(p) => setCurrentPage(p)}
          onSelectUser={(user) => setSelectedUserForDetail(user)}
          onChangeRole={(user, targetRole) => setSelectedUserForRole({ user, initialRole: targetRole })}
          onChangeStatus={(user) => setSelectedUserForStatus(user)}
          isLoading={loading}
        />
      )}

      {/* Inspection Modal */}
      {selectedUserForDetail && (
        <UserDetailModal
          userId={selectedUserForDetail.id}
          onClose={() => setSelectedUserForDetail(null)}
          onChangeRole={(u) => {
            setSelectedUserForDetail(null);
            setSelectedUserForRole({ user: u });
          }}
          onChangeStatus={(u) => {
            setSelectedUserForDetail(null);
            setSelectedUserForStatus(u);
          }}
        />
      )}

      {/* Edit Role Modal */}
      {selectedUserForRole && (
        <UserEditRoleModal
          user={selectedUserForRole.user}
          initialRole={selectedUserForRole.initialRole}
          onClose={() => setSelectedUserForRole(null)}
          onSuccess={() => {
            loadData();
            showToast("User role updated successfully.");
          }}
        />
      )}

      {/* Status Suspension Modal */}
      {selectedUserForStatus && (
        <UserStatusModal
          user={selectedUserForStatus}
          onClose={() => setSelectedUserForStatus(null)}
          onSuccess={() => {
            loadData();
            showToast("Account status updated successfully.");
          }}
        />
      )}
    </div>
  );
}

