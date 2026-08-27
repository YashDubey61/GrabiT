"use client";

import React from "react";
import { GlassCard } from "./glass-card";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtitle?: string;
  className?: string;
  highlight?: boolean;
}

/**
 * Standardized KPI metric stat card with high-contrast typography and subtle orange accents.
 */
export function StatCard({
  title,
  value,
  icon,
  change,
  changeType = "neutral",
  subtitle,
  className = "",
  highlight = false,
}: StatCardProps) {
  return (
    <GlassCard
      variant={highlight ? "glow" : "default"}
      padding="md"
      className={`flex flex-col justify-between group ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-caption font-bold uppercase tracking-wider text-muted line-clamp-1">
          {title}
        </span>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
            highlight
              ? "bg-primary text-black shadow-glow-primary"
              : "bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary/15"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            {icon}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="font-display text-2xl sm:text-[28px] font-extrabold tracking-tight text-foreground font-mono">
          {value}
        </span>
      </div>

      {(change || subtitle) && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px]">
          {change && (
            <span
              className={`inline-flex items-center gap-0.5 font-display font-bold ${
                changeType === "positive"
                  ? "text-emerald-400"
                  : changeType === "negative"
                    ? "text-danger"
                    : "text-muted"
              }`}
            >
              {changeType === "positive" && (
                <span className="material-symbols-outlined text-[13px]">trending_up</span>
              )}
              {changeType === "negative" && (
                <span className="material-symbols-outlined text-[13px]">trending_down</span>
              )}
              {change}
            </span>
          )}
          {subtitle && <span className="text-zinc-400 truncate">{subtitle}</span>}
        </div>
      )}
    </GlassCard>
  );
}
