"use client";

import React from "react";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  count?: number | string;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Standardized Section Header with title, optional count pill, subtitle, and action slot.
 */
export function SectionHeader({
  title,
  subtitle,
  count,
  icon,
  action,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-white/[0.06] ${className}`}>
      <div>
        <div className="flex items-center gap-2">
          {icon && (
            <span className="material-symbols-outlined text-primary text-lg shrink-0" aria-hidden="true">
              {icon}
            </span>
          )}
          <h2 className="font-display text-title sm:text-heading font-extrabold text-foreground tracking-tight">
            {title}
          </h2>
          {count !== undefined && (
            <span className="rounded-full bg-primary/10 border border-primary/25 px-2.5 py-0.5 font-display text-[11px] font-bold text-primary">
              {count}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-0.5 text-caption text-muted">{subtitle}</p>}
      </div>

      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}
