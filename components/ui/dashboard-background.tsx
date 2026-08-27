"use client";

import React from "react";

interface DashboardBackgroundProps {
  intensity?: "subtle" | "medium" | "vibrant";
  interactive?: boolean;
  className?: string;
}

/**
 * Premium Dark Glassmorphism Background for GRABIT Login & Dashboard surfaces:
 * - Student (/customer, /student, /auth)
 * - Vendor (/vendor, /vendor/auth)
 * - Super Admin (/superadmin, /superadmin/auth)
 *
 * Characteristics:
 * - Near-black / dark obsidian foundation (#070709)
 * - Subtle black-to-dark-charcoal tonal variation
 * - Soft, diffuse ambient lighting & minimal brand orange ambient glow
 * - Translucent glass depth layers
 * - Clean, modern, high-contrast, non-textured, non-blocking (pointer-events-none)
 */
export function DashboardBackground({
  intensity = "subtle",
  className = "",
}: DashboardBackgroundProps) {
  const isVibrant = intensity === "vibrant";
  const isMedium = intensity === "medium";

  // Controlled, subtle ambient glow opacities
  const topGlowOpacity = isVibrant ? "opacity-90" : isMedium ? "opacity-75" : "opacity-60";
  const cornerGlowOpacity = isVibrant ? "opacity-70" : isMedium ? "opacity-50" : "opacity-35";

  return (
    <div
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none bg-[#070709] ${className}`}
      aria-hidden="true"
    >
      {/* 1. Deep tonal gradient foundation */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 130% 90% at 50% -15%, #0e0f14 0%, #08080a 50%, #040405 100%)",
        }}
      />

      {/* 2. Signature GRABIT Ambient Top Glow (Soft diffused warm ember aura) */}
      <div
        className={`absolute -top-[15%] left-1/2 -translate-x-1/2 h-[520px] w-[800px] max-w-[140vw] rounded-full transition-opacity duration-700 ${topGlowOpacity}`}
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255, 110, 0, 0.065) 0%, rgba(255, 140, 0, 0.025) 42%, rgba(0, 0, 0, 0) 75%)",
          filter: "blur(75px)",
          transform: "translate3d(-50%, 0, 0)",
        }}
      />

      {/* 3. Subtle Right-Side Ambient Warmth */}
      <div
        className={`absolute top-[28%] -right-[12%] h-[450px] w-[450px] rounded-full transition-opacity duration-700 ${cornerGlowOpacity}`}
        style={{
          background:
            "radial-gradient(circle, rgba(255, 122, 0, 0.035) 0%, rgba(220, 75, 0, 0.012) 45%, transparent 70%)",
          filter: "blur(85px)",
        }}
      />

      {/* 4. Subtle Bottom-Left Obsidian Glow */}
      <div
        className={`absolute -bottom-[8%] -left-[10%] h-[480px] w-[480px] rounded-full transition-opacity duration-700 ${cornerGlowOpacity}`}
        style={{
          background:
            "radial-gradient(circle, rgba(255, 107, 0, 0.022) 0%, rgba(35, 35, 48, 0.06) 50%, transparent 70%)",
          filter: "blur(95px)",
        }}
      />

      {/* 5. Delicate Glass Sheen Overlay */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.018) 0%, rgba(255, 255, 255, 0) 25%, rgba(0, 0, 0, 0.35) 100%)",
        }}
      />

      {/* 6. Restrained Atmospheric Vignette for focus */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 60%, rgba(4, 4, 6, 0.55) 100%)",
        }}
      />
    </div>
  );
}
