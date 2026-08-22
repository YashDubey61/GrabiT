"use client";

import type { SystemAlertItem } from "@/lib/mock/superadmin";

interface SystemAlertsCardProps {
  alerts: SystemAlertItem[];
}

export function SystemAlertsCard({ alerts }: SystemAlertsCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated/80 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-caption font-bold uppercase tracking-widest text-foreground">
          System Alerts
        </h4>
        <span className="font-display text-[10px] font-bold text-primary animate-pulse uppercase tracking-wider">
          {alerts.length} Unresolved
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {alerts.map((alt) => (
          <div
            key={alt.id}
            className={`flex items-start gap-3 rounded-xl border-l-2 p-3 bg-surface-sunken/60 ${
              alt.severity === "error"
                ? "border-l-danger bg-danger/5"
                : alt.severity === "warning"
                  ? "border-l-warning bg-warning/5"
                  : "border-l-primary bg-primary/5"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                alt.severity === "error"
                  ? "text-danger"
                  : alt.severity === "warning"
                    ? "text-warning"
                    : "text-primary"
              }`}
              aria-hidden="true"
            >
              {alt.severity === "error"
                ? "error"
                : alt.severity === "warning"
                  ? "warning"
                  : "info"}
            </span>

            <div className="flex-1 min-w-0">
              <p className="font-display text-body-sm font-bold text-foreground">
                {alt.title}
              </p>
              <p className="text-caption text-faint line-clamp-1">
                {alt.subtitle}
              </p>
              <p className="mt-1 font-display text-[9px] uppercase tracking-wider text-muted">
                {alt.timestampText}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
