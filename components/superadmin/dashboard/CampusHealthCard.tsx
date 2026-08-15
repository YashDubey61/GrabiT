"use client";

interface CampusHealthCardProps {
  onExpandMap: () => void;
  activeCampuses?: number;
  northVol?: string;
  westVol?: string;
  southVol?: string;
}

export function CampusHealthCard({
  onExpandMap,
  activeCampuses = 142,
  northVol = "8.2k vol",
  westVol = "5.4k vol",
  southVol = "12.1k vol",
}: CampusHealthCardProps) {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-[#1e1f26]/90 p-6 backdrop-blur-md min-h-[320px]">
      {/* Top Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-lg border border-border bg-surface-sunken/80 px-3 py-1 font-display text-caption font-bold text-foreground backdrop-blur-md uppercase tracking-wider">
          Live Campus Health
        </span>

        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-1 text-success">
          <span className="h-2 w-2 rounded-full bg-success animate-ping" />
          <span className="font-display text-[10px] font-bold uppercase tracking-wider">
            {activeCampuses} Sites Optimal
          </span>
        </div>
      </div>

      {/* Cyberpunk Dark Map Canvas Background */}
      <div className="my-6 flex flex-1 items-center justify-center rounded-xl border border-border/40 bg-[#0d0d12] p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[48px] text-primary/60">
            hub
          </span>
          <span className="font-display text-caption font-bold text-muted uppercase tracking-widest">
            Campus Network Topology Grid
          </span>
          <p className="text-caption text-faint max-w-xs">
            Real-time telemetry from {activeCampuses} active university canteens across India.
          </p>
        </div>
      </div>

      {/* Bottom Regional Breakdown & Action */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border/50 pt-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-wider text-faint">
              North Region
            </p>
            <p className="font-display text-body-sm font-bold text-primary">
              {northVol}
            </p>
          </div>

          <div className="h-6 w-[1px] bg-border" />

          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-wider text-faint">
              West Region
            </p>
            <p className="font-display text-body-sm font-bold text-foreground">
              {westVol}
            </p>
          </div>

          <div className="h-6 w-[1px] bg-border" />

          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-wider text-faint">
              South Region
            </p>
            <p className="font-display text-body-sm font-bold text-foreground">
              {southVol}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExpandMap}
          className="rounded-xl bg-primary px-4 py-2 font-display text-caption font-extrabold uppercase tracking-wider text-on-primary shadow-glow-primary transition-all duration-150 active:scale-95 hover:opacity-90"
        >
          Expand Map
        </button>
      </div>
    </div>
  );
}
