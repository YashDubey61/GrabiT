"use client";

import Link from "next/link";

interface CampusHeaderProps {
  campusName: string;
  onOpenCampusSelector?: () => void;
  isDetecting?: boolean;
}

/**
 * Top app bar for GRABIT Student Dashboard with safe-area support,
 * clean campus switcher, and aligned action icons.
 */
export function CampusHeader({
  campusName,
  onOpenCampusSelector,
  isDetecting = false,
}: CampusHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4 sm:px-6">
        {/* Campus / Location Selector Trigger */}
        <button
          type="button"
          onClick={onOpenCampusSelector}
          className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-border/60 bg-surface-elevated/80 py-1.5 pl-2.5 pr-3 text-left transition-all hover:border-primary/50 active:scale-[0.98] mr-3"
          aria-label="Change active campus"
        >
          {/* Orange Location Pin */}
          <span
            className="material-symbols-outlined text-[20px] shrink-0 text-primary"
            aria-hidden="true"
          >
            location_on
          </span>

          {/* Campus Name & Chevron */}
          <div className="flex min-w-0 items-center gap-1.5 flex-1">
            <span className="truncate font-display text-body-sm font-bold text-foreground group-hover:text-primary transition-colors">
              {isDetecting ? "Detecting campus..." : campusName}
            </span>
            {isDetecting ? (
              <span className="material-symbols-outlined animate-spin text-[16px] text-primary shrink-0">
                progress_activity
              </span>
            ) : (
              <span
                className="material-symbols-outlined text-[18px] text-muted group-hover:text-primary transition-colors shrink-0"
                aria-hidden="true"
              >
                expand_more
              </span>
            )}
          </div>
        </button>

        {/* Quick Action Icons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/customer/notifications"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-surface-elevated/80 text-foreground transition-all hover:border-primary/50 hover:text-primary active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              notifications
            </span>
          </Link>

          <Link
            href="/customer/rewards"
            aria-label="Rewards"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-surface-elevated/80 text-foreground transition-all hover:border-primary/50 hover:text-primary active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              card_giftcard
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
