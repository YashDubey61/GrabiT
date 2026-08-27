"use client";

import type { SystemAlertItem } from "@/lib/mock/superadmin";

interface SystemAlertsCardProps {
  alerts: SystemAlertItem[];
}

export function SystemAlertsCard({ alerts }: SystemAlertsCardProps) {
  return (
    <div className="relative flex flex-col gap-4 rounded-2xl border border-white/[0.10] bg-[#0c0c0e]/80 p-5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36)]">
      {/* Top glare */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent opacity-60"
        aria-hidden="true"
      />

      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <h4 className="font-display text-caption font-extrabold uppercase tracking-wider text-white">
          System Alerts
        </h4>
        <span className="rounded-full bg-primary/15 border border-primary/30 px-2.5 py-0.5 font-display text-[10px] font-extrabold text-primary uppercase tracking-wider animate-pulse">
          {alerts.length} Unresolved
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {alerts.map((alt) => (
          <div
            key={alt.id}
            className={`flex items-start gap-3 rounded-2xl border p-3.5 backdrop-blur-md transition-all ${
              alt.severity === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : alt.severity === "warning"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-primary/30 bg-primary/10 text-primary"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] shrink-0 ${
                alt.severity === "error"
                  ? "text-red-400"
                  : alt.severity === "warning"
                    ? "text-amber-400"
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
              <p className="font-display text-body-sm font-bold text-white">
                {alt.title}
              </p>
              <p className="text-caption text-zinc-400 line-clamp-1">
                {alt.subtitle}
              </p>
              <p className="mt-1 font-display text-[9px] font-mono uppercase tracking-wider text-zinc-500">
                {alt.timestampText}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
