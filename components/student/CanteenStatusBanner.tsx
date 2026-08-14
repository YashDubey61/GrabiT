/**
 * "N canteens open now" status strip. The live dot uses shape + color +
 * label together (never color alone) to indicate the open state.
 */
export function CanteenStatusBanner({
  canteensOpen,
  estWaitMinutes,
}: {
  canteensOpen: number;
  estWaitMinutes: number;
}) {
  return (
    <section className="mb-6 flex items-center justify-between rounded-xl border border-border-subtle bg-surface-elevated p-4">
      <div className="flex items-center gap-3">
        <span
          className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-success"
          aria-hidden="true"
        />
        <span className="text-label font-700 uppercase tracking-[0.08em] text-foreground">
          {canteensOpen} canteens open now
        </span>
      </div>
      <span className="text-caption text-muted">
        Est. Wait: {estWaitMinutes}m
      </span>
    </section>
  );
}
