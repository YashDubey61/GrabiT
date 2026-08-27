"use client";

import React from "react";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "interactive" | "glow" | "subtle";
  className?: string;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

/**
 * Premium dark glass card container with frosted backdrop blur and subtle orange highlight.
 */
export function GlassCard({
  children,
  variant = "default",
  padding = "md",
  className = "",
  ...props
}: GlassCardProps) {
  const paddingStyles = {
    none: "",
    sm: "p-3 sm:p-3.5",
    md: "p-4 sm:p-5",
    lg: "p-5 sm:p-6",
    xl: "p-6 sm:p-8",
  }[padding];

  const variantStyles = {
    default:
      "bg-surface/70 border-white/[0.08] hover:border-white/[0.14] shadow-[0_8px_32px_rgba(0,0,0,0.36)]",
    elevated:
      "bg-surface-elevated/80 border-white/[0.10] hover:border-primary/40 shadow-[0_12px_40px_rgba(0,0,0,0.45)]",
    interactive:
      "bg-surface/70 border-white/[0.08] hover:border-primary/50 hover:bg-surface-elevated/90 hover:shadow-[0_12px_36px_rgba(0,0,0,0.5),0_0_20px_rgba(255,122,0,0.12)] hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer",
    glow:
      "bg-surface-elevated/80 border-primary/30 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_24px_rgba(255,122,0,0.15)]",
    subtle:
      "bg-white/[0.02] border-white/[0.05] hover:border-white/[0.10] shadow-sm",
  }[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-200 ${variantStyles} ${paddingStyles} ${className}`}
      {...props}
    >
      {/* Subtle top glare highlight for glass realism */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent opacity-60"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
