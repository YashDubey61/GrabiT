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
    <section className="mb-6 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-3">
        <span
          className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
          aria-hidden="true"
        />
        <span className="text-label font-bold uppercase tracking-[0.08em] text-foreground">
          {canteensOpen} canteens open now
        </span>
      </div>
      <span className="text-caption font-medium text-zinc-400">
        Est. Wait: <strong className="text-foreground font-mono">{estWaitMinutes}m</strong>
      </span>
    </section>
  );
}
