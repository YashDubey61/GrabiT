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
      <div className="flex flex-col rounded-2xl border border-border bg-[#1e1f26]/80 p-5 backdrop-blur-md">
        <h4 className="font-display text-caption font-bold uppercase tracking-widest text-faint mb-4">
          Growth Forecast
        </h4>

        <div className="flex h-36 items-end justify-between gap-2 px-2">
          {MONTHS.map((m) => (
            <div key={m.label} className="relative flex flex-1 flex-col items-center gap-1 h-full justify-end">
              {m.isCurrent && (
                <span className="absolute -top-6 font-display text-[9px] font-bold text-primary">
                  CURRENT
                </span>
              )}
              <div
                className={`w-full rounded-t-md transition-all duration-300 ${
                  m.isCurrent
                    ? "bg-primary shadow-glow-primary shadow-[0_0_12px_rgba(255,109,0,0.4)]"
                    : "bg-surface-sunken hover:bg-primary/40"
                }`}
                style={{ height: `${m.heightPercent}%` }}
              />
              <span className="font-display text-[10px] font-bold text-faint">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Milestone Banner */}
      <div className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-4 backdrop-blur-md">
        <div className="rounded-xl bg-primary p-3 text-black">
          <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
            rocket_launch
          </span>
        </div>
        <div>
          <p className="font-display text-body-sm font-bold text-foreground">
            Target Reached
          </p>
          <p className="text-caption text-faint">
            January campus GMV goals achieved 4 days ahead of schedule.
          </p>
        </div>
      </div>
    </div>
  );
}
