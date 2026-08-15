"use client";

import React, { useEffect, useState } from "react";
import type { OperationalNotificationItem } from "@/lib/notifications/operational_notifications";

interface VendorNotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder?: (orderId: string) => void;
}

export function VendorNotificationsDrawer({
  isOpen,
  onClose,
  onSelectOrder,
}: VendorNotificationsDrawerProps) {
  const [notifications, setNotifications] = useState<OperationalNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    fetch("/api/vendor/notifications")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.ok) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.openCount || 0);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleAcknowledge = async (id: string) => {
    try {
      const res = await fetch(`/api/vendor/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACKNOWLEDGE" }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, status: "ACKNOWLEDGED" } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // Ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="flex h-full w-full max-w-md flex-col border-l border-border bg-surface p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-primary" aria-hidden="true">
              notifications
            </span>
            <h2 className="font-display text-title font-extrabold text-foreground">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/20 px-2.5 py-0.5 font-display text-caption font-bold text-primary border border-primary/30">
                {unreadCount} New
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="rounded-xl p-2 text-faint hover:bg-surface-elevated hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        {/* List Body */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted gap-2">
              <span className="material-symbols-outlined animate-spin text-[24px] text-primary">
                progress_activity
              </span>
              <span className="font-display text-body-sm font-semibold">
                Loading notifications...
              </span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-faint">
              <span className="material-symbols-outlined text-[36px]">notifications_off</span>
              <p className="font-display text-body-sm font-semibold">No operational alerts</p>
              <p className="text-caption text-faint">
                You&apos;ll be notified here when new orders arrive.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const isUnread = item.status === "OPEN";
              return (
                <div
                  key={item.id}
                  className={`flex flex-col gap-2 rounded-2xl border p-4 transition-all ${
                    isUnread
                      ? "border-primary/40 bg-surface-elevated/90 shadow-glow-primary"
                      : "border-border bg-surface-elevated/40 opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`material-symbols-outlined text-[20px] ${
                          item.severity === "CRITICAL"
                            ? "text-danger"
                            : item.severity === "WARNING"
                              ? "text-warning"
                              : "text-primary"
                        }`}
                      >
                        {item.type === "NEW_ORDER"
                          ? "restaurant"
                          : item.severity === "CRITICAL"
                            ? "warning"
                            : "info"}
                      </span>
                      <h4 className="font-display text-body-sm font-bold text-foreground">
                        {item.title}
                      </h4>
                    </div>

                    {isUnread && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>

                  <p className="font-body text-caption text-muted">{item.message}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <span className="font-body text-label text-faint">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    <div className="flex items-center gap-2">
                      {item.relatedOrderId && onSelectOrder && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectOrder(item.relatedOrderId!);
                            onClose();
                          }}
                          className="font-display text-caption font-bold text-primary hover:underline"
                        >
                          View Order
                        </button>
                      )}

                      {isUnread && (
                        <button
                          type="button"
                          onClick={() => handleAcknowledge(item.id)}
                          className="rounded-lg border border-border bg-surface px-2.5 py-1 font-display text-label font-bold text-muted hover:text-foreground transition-colors"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
