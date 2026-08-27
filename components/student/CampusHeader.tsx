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
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#08080a]/85 backdrop-blur-2xl transition-all">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4 sm:px-6">
        {/* Campus / Location Selector Trigger */}
        <button
          type="button"
          onClick={onOpenCampusSelector}
          className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-white/[0.10] bg-white/[0.04] py-2 pl-3 pr-3.5 text-left backdrop-blur-md transition-all hover:border-primary/50 hover:bg-white/[0.08] active:scale-[0.98] mr-3 cursor-pointer"
          aria-label="Change active campus"
        >
          {/* Orange Location Pin */}
          <span
            className="material-symbols-outlined text-[20px] shrink-0 text-primary drop-shadow-[0_0_8px_rgba(255,122,0,0.4)]"
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
                className="material-symbols-outlined text-[18px] text-zinc-400 group-hover:text-primary transition-colors shrink-0"
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
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.04] text-foreground backdrop-blur-md transition-all hover:border-primary/50 hover:text-primary hover:bg-white/[0.08] active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              notifications
            </span>
          </Link>

          <Link
            href="/customer/rewards"
            aria-label="Rewards"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.04] text-foreground backdrop-blur-md transition-all hover:border-primary/50 hover:text-primary hover:bg-white/[0.08] active:scale-95"
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
