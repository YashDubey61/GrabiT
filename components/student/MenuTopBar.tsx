"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Vendor menu header. Owns the back button (needs router history) plus
 * the expand-in-place search field and the info-button trigger; the
 * actual search filtering and info panel content live in the parent
 * (VendorMenuScreen), which owns the query/open state — this component
 * is purely the header UI.
 */
export function MenuTopBar({
  title,
  isSearchOpen,
  searchQuery,
  onOpenSearch,
  onCloseSearch,
  onSearchQueryChange,
  onOpenInfo,
}: {
  title: string;
  isSearchOpen: boolean;
  searchQuery: string;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onSearchQueryChange: (value: string) => void;
  onOpenInfo: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus();
    }
  }, [isSearchOpen]);

  return (
    <header className="glass-navbar fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between px-5 md:px-16">
      {isSearchOpen ? (
        <div className="flex w-full items-center gap-3">
          <span className="material-symbols-outlined shrink-0 text-muted" aria-hidden="true">
            search
          </span>
          <input
            ref={inputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCloseSearch();
            }}
            placeholder={`Search ${title}'s menu...`}
            aria-label="Search this menu"
            className="h-11 w-full min-w-0 flex-1 bg-transparent text-body-sm text-foreground placeholder:text-faint focus:outline-none"
          />
          <button
            type="button"
            aria-label="Close search"
            onClick={onCloseSearch}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-foreground transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </button>
        </div>
      ) : (
        <>
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => router.back()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-foreground transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_back
              </span>
            </button>
            <h1 className="truncate font-display text-heading font-700 tracking-tight text-foreground">
              {title}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Search this menu"
              onClick={onOpenSearch}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-foreground transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                search
              </span>
            </button>
            <button
              type="button"
              aria-label="Vendor information"
              onClick={onOpenInfo}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-foreground transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                info
              </span>
            </button>
          </div>
        </>
      )}
    </header>
  );
}
