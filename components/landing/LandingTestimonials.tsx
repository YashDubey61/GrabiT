"use client";

import { MOCK_LANDING_DATA } from "@/lib/mock/landing";
import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";

export function LandingTestimonials() {
  const { testimonials } = MOCK_LANDING_DATA;

  return (
    <section className="py-20 bg-black px-6 md:px-12 border-t border-border/40 relative overflow-hidden">
      {/* Subtle Glow Ambience */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[600px] rounded-full bg-primary/5 blur-[160px]" />

      <div className="mx-auto max-w-7xl relative z-10">
        <h2 className="mb-14 text-center font-display text-[36px] sm:text-[48px] font-black text-foreground">
          The Team Behind <span className="text-primary">Grabit</span>
        </h2>

        <StaggerTestimonials testimonials={testimonials} />
      </div>
    </section>
  );
}
