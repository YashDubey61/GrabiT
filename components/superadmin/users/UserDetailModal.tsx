"use client";

import { useState, useEffect } from "react";
import type { UserItem, AuditLogEntry } from "@/lib/supabase/superadmin_users";

interface UserDetailModalProps {
  userId: string;
  onClose: () => void;
  onChangeRole: (user: UserItem) => void;
  onChangeStatus: (user: UserItem) => void;
}

export function UserDetailModal({
  userId,
  onClose,
  onChangeRole,
  onChangeStatus,
}: UserDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserItem | null>(null);
  const [ordersCount, setOrdersCount] = useState(0);
  const [totalSpentOrManaged, setTotalSpentOrManaged] = useState(0);
  const [auditTrail, setAuditTrail] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/superadmin/users/${userId}`);
        const data = await res.json();

        if (isMounted) {
          if (data.ok) {
            setUser(data.user);
            setOrdersCount(data.ordersCount ?? 0);
            setTotalSpentOrManaged(data.totalSpentOrManaged ?? 0);
            setAuditTrail(data.auditTrail ?? []);
          } else {
            setError(data.error || "Failed to load user profile.");
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err?.message || "Error loading user details.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[24px]">
              account_circle
            </span>
            <h2 className="font-display text-title font-bold text-foreground">
              User Profile & Audit Inspection
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted hover:bg-background hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-4 py-8 animate-pulse">
            <div className="h-12 w-12 rounded-full bg-border/40" />
            <div className="h-6 w-48 bg-border/40 rounded" />
            <div className="h-20 w-full bg-border/20 rounded-xl" />
          </div>
        ) : error || !user ? (
          <div className="py-8 text-center space-y-3">
            <p className="font-display text-body font-bold text-danger">{error || "User not found."}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-background px-4 py-2 font-display text-caption font-bold text-foreground"
            >
              Close Modal
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Profile Overview */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-background/50 p-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border bg-background flex items-center justify-center font-bold text-primary text-xl">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName || "User"} className="h-full w-full object-cover" />
                  ) : (
                    (user.fullName || user.phone || "U").charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="font-display text-body font-extrabold text-foreground">
                    {user.fullName || user.phone || "Unnamed User"}
                  </h3>
                  <p className="font-mono text-caption text-muted">{user.phone}</p>
                  {user.grabitUserId && (
                    <p className="font-mono text-[11px] text-primary font-bold">
                      GrabIt ID: {user.grabitUserId}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChangeRole(user)}
                  className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 font-display text-caption font-bold text-primary hover:bg-primary/20 transition-colors"
                >
                  Edit Role
                </button>
                <button
                  type="button"
                  onClick={() => onChangeStatus(user)}
                  className="rounded-xl border border-border bg-background px-3 py-1.5 font-display text-caption font-bold text-muted hover:text-foreground transition-colors"
                >
                  Change Status
                </button>
              </div>
            </div>

            {/* Profile Grid Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-caption font-display">
              <div className="rounded-xl border border-border/60 bg-background/30 p-3">
                <span className="text-muted block text-[11px] font-bold">User UUID</span>
                <span className="font-mono text-foreground text-[12px] break-all">{user.id}</span>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/30 p-3">
                <span className="text-muted block text-[11px] font-bold">Role</span>
                <span className="capitalize font-bold text-foreground">{user.role}</span>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/30 p-3">
                <span className="text-muted block text-[11px] font-bold">Account Status</span>
                <span className={`capitalize font-bold ${user.accountStatus === "active" ? "text-emerald-400" : "text-rose-400"}`}>
                  {user.accountStatus}
                </span>
                {user.statusReason && (
                  <p className="text-[11px] text-muted italic mt-0.5">Reason: {user.statusReason}</p>
                )}
              </div>

              <div className="rounded-xl border border-border/60 bg-background/30 p-3">
                <span className="text-muted block text-[11px] font-bold">Campus / Canteen Association</span>
                <span className="font-bold text-foreground">
                  {user.canteenName ? `Canteen: ${user.canteenName}` : user.campusName ? `Campus: ${user.campusName}` : "Platform Global"}
                </span>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/30 p-3">
                <span className="text-muted block text-[11px] font-bold">Joined Date</span>
                <span className="text-foreground">
                  {new Date(user.createdAt).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/30 p-3">
                <span className="text-muted block text-[11px] font-bold">Last Activity</span>
                <span className="text-foreground">
                  {new Date(user.lastActiveAt || user.createdAt).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Relevant Order Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-surface/50 p-4">
                <span className="font-display text-[11px] font-bold text-muted block">
                  {user.role === "student" ? "Total Orders Placed" : "Completed Orders Managed"}
                </span>
                <span className="font-display text-headline font-extrabold text-foreground mt-1 block">
                  {ordersCount}
                </span>
              </div>

              <div className="rounded-2xl border border-border bg-surface/50 p-4">
                <span className="font-display text-[11px] font-bold text-muted block">
                  {user.role === "student" ? "Total Spent" : "Total Volume Managed"}
                </span>
                <span className="font-display text-headline font-extrabold text-emerald-400 mt-1 block">
                  ₹{totalSpentOrManaged.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Audit Trail Section */}
            <div className="space-y-3 pt-2">
              <h4 className="font-display text-body-sm font-bold text-foreground flex items-center gap-2">
                <span className="material-symbols-outlined text-muted text-[18px]">history</span>
                <span>Security & Role Audit History</span>
              </h4>

              {auditTrail.length === 0 ? (
                <p className="font-display text-caption text-muted italic bg-background/30 rounded-xl p-3 border border-border/40">
                  No security or role mutations recorded for this user yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {auditTrail.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-border/60 bg-background/40 p-3 text-caption font-display space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-primary capitalize">{entry.action.replace("_", " ")}</span>
                        <span className="text-muted">
                          {new Date(entry.createdAt).toLocaleString("en-IN")}
                        </span>
                      </div>

                      {entry.previousRole && entry.newRole && (
                        <p className="text-muted text-[11px]">
                          Role changed: <span className="text-foreground font-bold">{entry.previousRole}</span> →{" "}
                          <span className="text-primary font-bold">{entry.newRole}</span>
                        </p>
                      )}

                      {entry.previousStatus && entry.newStatus && (
                        <p className="text-muted text-[11px]">
                          Status changed: <span className="text-foreground font-bold">{entry.previousStatus}</span> →{" "}
                          <span className="text-rose-400 font-bold">{entry.newStatus}</span>
                        </p>
                      )}

                      {entry.reason && (
                        <p className="text-muted text-[11px] italic">Reason: {entry.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
