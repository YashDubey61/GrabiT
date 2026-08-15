"use client";

import Link from "next/link";

export interface ProfileMenuItemProps {
  icon: string;
  title: string;
  subtitle: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "danger";
}

export function ProfileMenuItem({
  icon,
  title,
  subtitle,
  href,
  onClick,
  variant = "default",
}: ProfileMenuItemProps) {
  const isDanger = variant === "danger";

  const content = (
    <div
      className={`flex items-center justify-between rounded-xl border p-4 backdrop-blur-md transition-all duration-150 active:scale-[0.98] ${
        isDanger
          ? "border-danger/20 bg-danger-soft/40 hover:border-danger/40"
          : "border-border bg-[#1e1f26]/80 hover:border-white/20"
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            isDanger
              ? "bg-danger/20 text-danger"
              : "bg-surface-elevated text-primary border border-border"
          }`}
        >
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
            {icon}
          </span>
        </div>

        <div className="text-left">
          <span
            className={`block font-display text-body-sm font-bold ${
              isDanger ? "text-danger" : "text-foreground"
            }`}
          >
            {title}
          </span>
          <span className="block text-caption text-faint">{subtitle}</span>
        </div>
      </div>

      {!isDanger && (
        <span className="material-symbols-outlined text-faint" aria-hidden="true">
          chevron_right
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block w-full">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="block w-full">
      {content}
    </button>
  );
}
