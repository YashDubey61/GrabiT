"use client";

import { useState } from "react";
import type { UserItem, AccountStatus } from "@/lib/supabase/superadmin_users";

interface UserStatusModalProps {
  user: UserItem;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserStatusModal({ user, onClose, onSuccess }: UserStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<AccountStatus>(user.accountStatus);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedStatus === user.accountStatus) {
      onClose();
      return;
    }

    if ((selectedStatus === "suspended" || selectedStatus === "disabled") && !reason.trim()) {
      setError("A reason is required when suspending or disabling an account.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/superadmin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus: selectedStatus,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Failed to update account status.");
      }
    } catch (err: any) {
      setError(err?.message || "Internal server error.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = user.fullName || user.phone || user.grabitUserId || "User";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-400 text-[22px]">
              block
            </span>
            <h3 className="font-display text-body font-bold text-foreground">
              Account Status & Suspension
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

        {/* User summary */}
        <div className="rounded-xl border border-border/60 bg-background/50 p-3 text-caption font-display">
          <div className="font-bold text-foreground">{displayName}</div>
          <div className="text-muted text-[11px] font-mono">{user.phone}</div>
          <div className="text-muted text-[11px] mt-1">Current Status: <span className="text-rose-400 capitalize font-bold">{user.accountStatus}</span></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-caption font-display font-bold text-danger text-[12px]">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block font-display text-caption font-bold text-foreground">
              New Account Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as AccountStatus)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground focus:border-primary focus:outline-none transition-colors"
            >
              <option value="active">Active (Normal Access)</option>
              <option value="suspended">Suspended (Temporary Lock)</option>
              <option value="disabled">Disabled (Permanent Deactivation)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-display text-caption font-bold text-foreground">
              Reason for Status Change <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Terms of Service violation / Security investigation"
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
              disabled={submitting || selectedStatus === user.accountStatus}
              className={`rounded-xl px-4 py-2 font-display text-caption font-bold transition-colors disabled:opacity-50 ${
                selectedStatus === "active"
                  ? "bg-emerald-500 text-black hover:bg-emerald-400"
                  : "bg-rose-500 text-white hover:bg-rose-600"
              }`}
            >
              {submitting ? "Updating..." : "Confirm Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
