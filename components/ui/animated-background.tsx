"use client";

import React from "react";

interface AnimatedBackgroundProps {
  className?: string;
  intensity?: "subtle" | "medium" | "vibrant";
  interactive?: boolean;
}

/**
 * Premium Dark Glassmorphism Ambient Environment:
 * Clean, lightweight, GPU-optimized, non-textured background with subtle GRABIT brand orange ambient bloom.
 */
export function AnimatedBackground({
  className = "",
  intensity = "subtle",
}: AnimatedBackgroundProps) {
  const isVibrant = intensity === "vibrant";
  const isMedium = intensity === "medium";

  const topGlowOpacity = isVibrant ? "opacity-90" : isMedium ? "opacity-75" : "opacity-60";
  const cornerGlowOpacity = isVibrant ? "opacity-70" : isMedium ? "opacity-50" : "opacity-35";

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden select-none bg-[#070709] ${className}`}
      aria-hidden="true"
    >
      {/* 1. Deep tonal gradient baseline */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 130% 90% at 50% -15%, #0e0f14 0%, #08080a 50%, #040405 100%)",
        }}
      />

      {/* 2. Top-center ambient brand glow */}
      <div
        className={`absolute -top-[15%] left-1/2 -translate-x-1/2 h-[520px] w-[800px] max-w-[140vw] rounded-full transition-opacity duration-700 ${topGlowOpacity}`}
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255, 110, 0, 0.065) 0%, rgba(255, 140, 0, 0.025) 42%, rgba(0, 0, 0, 0) 75%)",
          filter: "blur(75px)",
          transform: "translate3d(-50%, 0, 0)",
        }}
      />

      {/* 3. Right-side subtle warmth */}
      <div
        className={`absolute top-[28%] -right-[12%] h-[450px] w-[450px] rounded-full transition-opacity duration-700 ${cornerGlowOpacity}`}
        style={{
          background:
            "radial-gradient(circle, rgba(255, 122, 0, 0.035) 0%, rgba(220, 75, 0, 0.012) 45%, transparent 70%)",
          filter: "blur(85px)",
        }}
      />

      {/* 4. Bottom-left obsidian depth */}
      <div
        className={`absolute -bottom-[8%] -left-[10%] h-[480px] w-[480px] rounded-full transition-opacity duration-700 ${cornerGlowOpacity}`}
        style={{
          background:
            "radial-gradient(circle, rgba(255, 107, 0, 0.022) 0%, rgba(35, 35, 48, 0.06) 50%, transparent 70%)",
          filter: "blur(95px)",
        }}
      />

      {/* 5. Minimal glass sheen */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.018) 0%, rgba(255, 255, 255, 0) 25%, rgba(0, 0, 0, 0.35) 100%)",
        }}
      />

      {/* 6. Soft vignette */}
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
