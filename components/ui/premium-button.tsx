"use client";

import React from "react";

export interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  children: React.ReactNode;
}

/**
 * Premium high-contrast button in signature GRABIT Orange and dark glass styling.
 */
export function PremiumButton({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = "",
  disabled,
  ...props
}: PremiumButtonProps) {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
    md: "px-4 py-2.5 text-body-sm rounded-xl gap-2",
    lg: "px-6 py-3.5 text-body rounded-2xl gap-2.5",
  }[size];

  const variantStyles = {
    primary:
      "bg-primary text-black font-extrabold hover:bg-primary-soft shadow-[0_4px_20px_-4px_rgba(255,122,0,0.4)] hover:shadow-[0_6px_24px_-2px_rgba(255,122,0,0.55)] active:scale-[0.98]",
    secondary:
      "bg-surface-elevated text-foreground border border-white/[0.12] hover:border-primary/40 hover:bg-surface-elevated/90 active:scale-[0.98]",
    glass:
      "bg-white/[0.06] text-white border border-white/[0.12] backdrop-blur-md hover:bg-white/[0.12] hover:border-white/[0.2] active:scale-[0.98]",
    outline:
      "border border-primary/40 text-primary hover:bg-primary/10 active:scale-[0.98]",
    danger:
      "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25 active:scale-[0.98]",
    ghost:
      "text-muted hover:text-foreground hover:bg-white/[0.06] active:scale-[0.98]",
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-display font-bold tracking-wide transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="material-symbols-outlined animate-spin text-[18px]">
          progress_activity
        </span>
      ) : leftIcon ? (
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          {leftIcon}
        </span>
      ) : null}

      <span>{children}</span>

      {!isLoading && rightIcon && (
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
}
