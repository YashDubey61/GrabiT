"use client";

export interface VendorNotificationCenterHeaderProps {
  unreadCount: number;
  totalCount: number;
  onMarkAllAsRead: () => void;
  onOpenPreferences: () => void;
}

export function VendorNotificationCenterHeader({
  unreadCount,
  totalCount,
  onMarkAllAsRead,
  onOpenPreferences,
}: VendorNotificationCenterHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-title font-extrabold text-foreground sm:text-display">
            Notifications Center
          </h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary/20 px-3 py-1 font-display text-caption font-bold text-primary border border-primary/30">
              {unreadCount} Unread
            </span>
          )}
        </div>
        <p className="text-caption text-muted mt-0.5">
          Real-time operational alerts for orders, inventory, settlements & system updates ({totalCount} total)
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 font-display text-caption font-bold text-primary hover:bg-primary hover:text-on-primary active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Mark All as Read
          </button>
        )}

        <button
          type="button"
          onClick={onOpenPreferences}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-elevated px-4 py-2 font-display text-caption font-bold text-muted hover:border-primary/40 hover:text-foreground active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">settings</span>
          Preferences
        </button>
      </div>
    </div>
  );
}
