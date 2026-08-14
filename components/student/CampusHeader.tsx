/**
 * Top app bar for Campus Home. Static/display only — campus switching and
 * the QR scanner are out of scope for Day 2 (no camera access, no
 * multi-campus session logic yet), so those controls render but are
 * inert. No fake behavior: clicking "PSIT Kanpur" does nothing until a
 * real campus-switch flow exists, rather than pretending to open a menu.
 */
export function CampusHeader({ campusName }: { campusName: string }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between bg-background px-5 md:px-16">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-surface-elevated font-display text-caption font-800 text-primary">
          G
        </div>
        <div className="flex flex-col">
          <span className="text-label font-700 uppercase tracking-[0.14em] text-primary">
            Campus
          </span>
          <div className="flex items-center gap-1">
            <span className="text-body font-700 text-foreground">
              {campusName}
            </span>
            <span
              className="material-symbols-outlined text-[18px] text-primary"
              aria-hidden="true"
            >
              expand_more
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label="Scan QR code"
        className="flex h-10 w-10 items-center justify-center text-primary transition-transform active:scale-95"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          qr_code_scanner
        </span>
      </button>
    </header>
  );
}
