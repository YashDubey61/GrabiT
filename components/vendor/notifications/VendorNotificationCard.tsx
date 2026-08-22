"use client";

import Link from "next/link";
import type { OperationalNotificationItem } from "@/lib/notifications/operational_notifications";
import {
  getCategoryForType,
  getDeepLinkForNotification,
  getIconForNotification,
} from "@/lib/supabase/vendor_notifications_center";

export interface VendorNotificationCardProps {
  notification: OperationalNotificationItem;
  onToggleRead: (id: string, currentStatus: string) => void;
}

export function VendorNotificationCard({
  notification,
  onToggleRead,
}: VendorNotificationCardProps) {
  const isUnread = notification.status === "OPEN";
  const category = getCategoryForType(notification.type);
  const deepLink = getDeepLinkForNotification(notification);
  const icon = getIconForNotification(notification);

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-5 backdrop-blur-md transition-all shadow-lg ${
        isUnread
          ? "border-primary/40 bg-surface-elevated shadow-glow-primary"
          : "border-border/60 bg-surface-elevated/40 opacity-85 hover:opacity-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Category Icon */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              notification.severity === "CRITICAL"
                ? "bg-danger/20 text-danger border border-danger/30"
                : notification.severity === "WARNING"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-primary/20 text-primary border border-primary/30"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-body-sm text-foreground">
                {notification.title}
              </h3>
              <span className="rounded-md bg-background border border-border/40 px-2 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-wider text-muted">
                {category}
              </span>
            </div>
            <span className="text-[11px] text-faint font-mono mt-0.5">
              {new Date(notification.createdAt).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Unread Indicator Pill */}
        {isUnread && (
          <span className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 animate-pulse mt-1" />
        )}
      </div>

      {/* Notification Body Message */}
      <p className="font-body text-body-sm text-foreground/90 leading-relaxed">
        {notification.message}
      </p>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-1">
        <Link
          href={deepLink}
          onClick={() => {
            if (isUnread) onToggleRead(notification.id, "OPEN");
          }}
          className="flex items-center gap-1 font-display text-caption font-bold text-primary hover:underline"
        >
          <span>View Module</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>

        <button
          type="button"
          onClick={() => onToggleRead(notification.id, notification.status)}
          className="rounded-lg border border-border bg-background px-3 py-1 font-display text-caption font-bold text-muted hover:text-foreground transition-colors"
        >
          {isUnread ? "Mark as Read" : "Mark as Unread"}
        </button>
      </div>
    </div>
  );
}
