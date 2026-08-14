// Converted from the "Call Stall" / "Message" action row. Decorative for
// Day 4 — no real telephony or messaging integration exists yet
// (consistent with how MenuTopBar/CheckoutHeader treat their own
// not-yet-wired icon buttons). Real buttons with proper labels, not dead
// links, so they're honest about doing nothing yet rather than silently
// broken.
export function OrderContactActions() {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-surface py-4 text-caption font-700 text-foreground transition-transform active:scale-95"
      >
        <span className="material-symbols-outlined text-lg" aria-hidden="true">
          call
        </span>
        Call Stall
      </button>
      <button
        type="button"
        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-surface py-4 text-caption font-700 text-foreground transition-transform active:scale-95"
      >
        <span className="material-symbols-outlined text-lg" aria-hidden="true">
          chat_bubble
        </span>
        Message
      </button>
    </div>
  );
}
