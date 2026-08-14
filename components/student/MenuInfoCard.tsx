/**
 * Static canteen info strip (prep time, rating, open state, description).
 * No interaction — pure display, so no client boundary needed.
 */
export function MenuInfoCard({
  avgPrepMinutes,
  rating,
  ratingCount,
  isOpen,
  description,
}: {
  avgPrepMinutes: number;
  rating: number;
  ratingCount: string;
  isOpen: boolean;
  description: string;
}) {
  return (
    <section className="mb-6 rounded-xl border border-border-subtle bg-surface-elevated p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span
              className="material-symbols-outlined text-[20px] text-primary"
              aria-hidden="true"
            >
              timer
            </span>
            <span className="text-label font-700 uppercase tracking-[0.08em] text-muted">
              Avg prep time: {avgPrepMinutes} mins
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className="material-symbols-outlined text-[18px] text-warning"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              star
            </span>
            <span className="text-body font-700 text-foreground">{rating}</span>
            <span className="text-caption text-muted">({ratingCount})</span>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-label font-700 uppercase ${
            isOpen
              ? "border-primary/40 bg-primary/20 text-primary"
              : "border-border bg-surface text-muted"
          }`}
        >
          {isOpen ? "Open Now" : "Closed"}
        </span>
      </div>
      <p className="text-caption leading-relaxed text-muted">{description}</p>
    </section>
  );
}
