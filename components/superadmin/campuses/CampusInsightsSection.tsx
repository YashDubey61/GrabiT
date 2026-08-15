"use client";

import type { CampusActivityFeedItem } from "@/lib/mock/superadmin";

interface CampusInsightsSectionProps {
  activities: CampusActivityFeedItem[];
  onViewAllLogs?: () => void;
}

export function CampusInsightsSection({
  activities,
  onViewAllLogs,
}: CampusInsightsSectionProps) {
  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-6">
      {/* Geospatial Reach Map Card */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-[#1e1f26]/80 p-6 backdrop-blur-md lg:col-span-2 min-h-[300px]">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-title font-bold text-foreground">
            Geospatial Reach
          </h3>
          <span className="rounded bg-surface-sunken px-2.5 py-1 font-display text-[10px] font-bold text-muted border border-border uppercase">
            LIVE TRAFFIC
          </span>
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center rounded-xl border border-border/40 bg-[#0c0e14] p-8 text-center overflow-hidden min-h-[200px]">
          <span className="material-symbols-outlined text-[48px] text-primary animate-bounce">
            location_on
          </span>
          <p className="mt-2 font-display text-title font-bold text-foreground">
            Interactive Expansion View
          </p>
          <p className="mt-1 max-w-sm text-body-sm text-faint">
            Visualizing logistics corridors and supply chain nodes across the Indian subcontinent.
          </p>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="flex flex-col justify-between rounded-2xl border border-border bg-[#1e1f26]/80 p-6 backdrop-blur-md">
        <div>
          <h3 className="mb-4 font-display text-title font-bold text-foreground">
            Recent Activity
          </h3>

          <div className="flex flex-col gap-4">
            {activities.map((act) => (
              <div key={act.id} className="flex gap-3 items-start">
                <div
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    act.type === "new"
                      ? "bg-primary"
                      : act.type === "milestone"
                        ? "bg-success"
                        : "bg-warning"
                  }`}
                />
                <div>
                  <p className="font-display text-body-sm font-bold text-foreground">
                    {act.title}
                  </p>
                  <p className="text-[12px] text-faint line-clamp-2">
                    {act.description}
                  </p>
                  <span className="mt-1 block font-display text-[9px] font-bold text-muted uppercase tracking-widest">
                    {act.timestampText}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAllLogs}
          className="mt-6 w-full rounded-xl border border-border py-2.5 font-display text-caption font-bold text-foreground transition-colors hover:bg-surface-elevated active:scale-95"
        >
          VIEW ALL LOGS
        </button>
      </div>
    </section>
  );
}
