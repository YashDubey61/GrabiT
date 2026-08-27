"use client";

import { AnimatedBackground } from "@/components/ui/animated-background";

interface DashboardBackgroundProps {
  intensity?: "subtle" | "medium" | "vibrant";
  interactive?: boolean;
  className?: string;
}

/**
 * Scoped background layer for GRABIT role dashboard shells:
 * - /customer/* and /student/* (Student Dashboard)
 * - /vendor/* (Vendor Dashboard)
 * - /superadmin/* (Super Admin Command Center)
 *
 * Strictly excluded from all public and authentication pages (/auth, /landing, etc.)
 */
export function DashboardBackground({
  intensity = "subtle",
  interactive = true,
  className = "",
}: DashboardBackgroundProps) {
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <AnimatedBackground intensity={intensity} interactive={interactive} />
    </div>
  );
}
