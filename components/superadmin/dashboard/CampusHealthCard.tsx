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
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.10] bg-[#0c0c0e]/80 p-6 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36)] min-h-[320px]">
      {/* Top glare */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent opacity-60"
        aria-hidden="true"
      />

      {/* Top Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1 font-display text-caption font-extrabold text-white backdrop-blur-md uppercase tracking-wider">
          Live Campus Health
        </span>

        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          <span className="font-display text-[10px] font-extrabold uppercase tracking-wider">
            {activeCampuses} Sites Optimal
          </span>
        </div>
      </div>

      {/* Map Topology Preview */}
      <div className="my-6 flex flex-1 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center backdrop-blur-md">
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[48px] text-primary drop-shadow-[0_0_12px_rgba(255,122,0,0.5)]">
            hub
          </span>
          <span className="font-display text-caption font-extrabold text-white uppercase tracking-widest">
            Campus Network Topology Grid
          </span>
          <p className="text-caption text-zinc-400 max-w-xs">
            Real-time telemetry from {activeCampuses} active university canteens across India.
          </p>
        </div>
      </div>

      {/* Bottom Regional Breakdown & Action */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-white/[0.08] pt-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              North Region
            </p>
            <p className="font-display text-body-sm font-extrabold text-primary font-mono">
              {northVol}
            </p>
          </div>

          <div className="h-6 w-[1px] bg-white/[0.10]" />

          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              West Region
            </p>
            <p className="font-display text-body-sm font-extrabold text-white font-mono">
              {westVol}
            </p>
          </div>

          <div className="h-6 w-[1px] bg-white/[0.10]" />

          <div>
            <p className="font-display text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              South Region
            </p>
            <p className="font-display text-body-sm font-extrabold text-white font-mono">
              {southVol}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExpandMap}
          className="rounded-2xl bg-primary px-5 py-2.5 font-display text-caption font-extrabold uppercase tracking-wider text-black shadow-[0_4px_20px_-2px_rgba(255,122,0,0.45)] hover:bg-primary-soft transition-all duration-150 active:scale-95 cursor-pointer"
        >
          Expand Map
        </button>
      </div>
    </div>
  );
}
