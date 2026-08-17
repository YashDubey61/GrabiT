"use client";

interface CampusHeaderProps {
  campusName: string;
  onOpenCampusSelector?: () => void;
  isDetecting?: boolean;
}

/**
 * Top app bar for Campus Home with dynamic location display & interactive campus switcher.
 */
export function CampusHeader({
  campusName,
  onOpenCampusSelector,
  isDetecting = false,
}: CampusHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between bg-background border-b border-border-subtle/50 px-5 md:px-16 backdrop-blur-md">
      {/* Location / Campus Selector Trigger */}
      <button
        type="button"
        onClick={onOpenCampusSelector}
        className="flex items-center gap-3 group text-left transition-transform active:scale-[0.98]"
        aria-label="Change active campus"
      >
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-surface-elevated font-display text-caption font-800 text-primary border border-border group-hover:border-primary transition-colors">
          <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
            location_on
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-label font-700 uppercase tracking-[0.14em] text-primary flex items-center gap-1">
            <span>Campus</span>
            {isDetecting && (
              <span className="material-symbols-outlined animate-spin text-[12px] text-primary">
                progress_activity
              </span>
            )}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-body font-700 text-foreground group-hover:text-primary transition-colors truncate max-w-[180px] sm:max-w-[280px]">
              {isDetecting ? "Detecting campus..." : campusName}
            </span>
            <span
              className="material-symbols-outlined text-[18px] text-primary group-hover:translate-y-0.5 transition-transform"
              aria-hidden="true"
            >
              expand_more
            </span>
          </div>
        </div>
      </button>

      {/* Quick Action Icons */}
      <div className="flex items-center gap-2">
        <a
          href="/student/notifications"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-primary hover:bg-surface-elevated transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            notifications
          </span>
        </a>

        <button
          type="button"
          aria-label="Scan QR code"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-primary hover:bg-surface-elevated transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            qr_code_scanner
          </span>
        </button>
      </div>
    </header>
  );
}
