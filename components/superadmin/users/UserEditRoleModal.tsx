"use client";

import { useState } from "react";
import type { UserItem, UserRole } from "@/lib/supabase/superadmin_users";

interface UserEditRoleModalProps {
  user: UserItem;
  initialRole?: UserRole;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserEditRoleModal({
  user,
  initialRole,
  onClose,
  onSuccess,
}: UserEditRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole || user.role);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleLabels: Record<UserRole, string> = {
    student: "Student",
    vendor: "Vendor Manager",
    admin: "Super Admin",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedRole === user.role) {
      onClose();
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/superadmin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newRole: selectedRole,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Unable to update user role. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Unable to update user role. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = user.fullName || user.phone || user.grabitUserId || "User";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">
              manage_accounts
            </span>
            <h3 className="font-display text-body font-bold text-foreground">
              Change User Role
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1 text-muted hover:bg-background hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* User Card Info */}
        <div className="rounded-2xl border border-border/80 bg-background/60 p-4 space-y-2 font-display text-caption">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground text-body-sm">{displayName}</span>
            <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
              {user.grabitUserId || "GRB-USER"}
            </span>
          </div>
          {user.email && <div className="text-muted text-[11px]">{user.email}</div>}
          <div className="text-muted text-[11px]">Phone: <span className="text-foreground">{user.phone}</span></div>
          
          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[12px]">
            <div>
              <span className="text-muted">Current Role: </span>
              <span className="font-bold text-foreground">{roleLabels[user.role]}</span>
            </div>
            <div>
              <span className="text-muted">New Role: </span>
              <span className="font-bold text-primary">{roleLabels[selectedRole]}</span>
            </div>
          </div>
        </div>

        {/* Sensitive Promotion Warning */}
        {selectedRole === "admin" && user.role !== "admin" && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex items-start gap-2.5 text-amber-300 text-[12px] font-display">
            <span className="material-symbols-outlined text-[20px] shrink-0 text-amber-400">warning</span>
            <div>
              <div className="font-bold text-amber-200">Sensitive Operation Warning</div>
              <div>This will grant Super Admin access to this account. Are you sure?</div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-danger/40 bg-danger/10 p-3.5 font-display text-[12px] font-bold text-danger flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block font-display text-caption font-bold text-foreground">
              Select New Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-display text-caption font-semibold text-foreground focus:border-primary focus:outline-none transition-colors"
            >
              <option value="student">Student</option>
              <option value="vendor">Vendor Manager</option>
              <option value="admin">Super Admin</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-display text-caption font-bold text-foreground">
              Reason / Note (Audit Log Requirement)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Approved vendor management authorization"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-background px-4 py-2 font-display text-caption font-bold text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedRole === user.role}
              className="rounded-xl bg-primary px-5 py-2 font-display text-caption font-bold text-on-primary hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Confirm Change</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

