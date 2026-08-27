"use client";

const MONTHS = [
  { label: "SEP", heightPercent: 40 },
  { label: "OCT", heightPercent: 60 },
  { label: "NOV", heightPercent: 55 },
  { label: "DEC", heightPercent: 80 },
  { label: "JAN", heightPercent: 95, isCurrent: true },
];

export function GrowthForecastCard() {
  return (
    <div className="flex flex-col gap-4">
      {/* Forecast Bar Chart Card */}
      <div className="relative flex flex-col rounded-2xl border border-white/[0.10] bg-[#0c0c0e]/80 p-5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent opacity-60" aria-hidden="true" />
        <h4 className="font-display text-caption font-extrabold uppercase tracking-wider text-zinc-400 mb-4">
          Growth Forecast
        </h4>

        <div className="flex h-36 items-end justify-between gap-2 px-2">
          {MONTHS.map((m) => (
            <div key={m.label} className="relative flex flex-1 flex-col items-center gap-1 h-full justify-end">
              {m.isCurrent && (
                <span className="absolute -top-6 font-display text-[9px] font-extrabold text-primary">
                  CURRENT
                </span>
              )}
              <div
                className={`w-full rounded-t-lg transition-all duration-300 ${
                  m.isCurrent
                    ? "bg-gradient-to-t from-primary to-orange-400 shadow-[0_0_12px_rgba(255,122,0,0.5)]"
                    : "bg-white/[0.05] hover:bg-primary/40"
                }`}
                style={{ height: `${m.heightPercent}%` }}
              />
              <span className="font-display text-[10px] font-bold text-zinc-500">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Milestone Banner */}
      <div className="relative flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-4 backdrop-blur-xl shadow-[0_4px_20px_rgba(255,122,0,0.15)]">
        <div className="rounded-2xl bg-primary p-3 text-black shadow-[0_2px_12px_rgba(255,122,0,0.4)]">
          <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
            rocket_launch
          </span>
        </div>
        <div>
          <p className="font-display text-body-sm font-extrabold text-white">
            Target Reached
          </p>
          <p className="text-caption text-zinc-300">
            January campus GMV goals achieved 4 days ahead of schedule.
          </p>
        </div>
      </div>
    </div>
  );
}
