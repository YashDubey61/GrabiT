"use client";

import Image from "next/image";
import { MOCK_LANDING_DATA } from "@/lib/mock/landing";

export function LandingTestimonials() {
  const { testimonials } = MOCK_LANDING_DATA;

  return (
    <section className="py-20 bg-black px-6 md:px-12 border-t border-border/40">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-14 text-center font-display text-[36px] sm:text-[48px] font-black text-foreground">
          Voices from the <span className="text-primary">Field</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className={`relative flex flex-col justify-between rounded-3xl border p-6 sm:p-8 backdrop-blur-md transition-all duration-300 ${
                t.isFeatured
                  ? "border-primary/40 bg-[#1e1f26] shadow-glow-primary scale-105"
                  : "border-border bg-[#1e1f26]/60 hover:border-white/20"
              }`}
            >
              <span className="material-symbols-outlined absolute top-6 right-6 text-[48px] text-primary/20 pointer-events-none">
                format_quote
              </span>

              <p className="relative z-10 mb-6 font-body text-body-md italic text-foreground/90 leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3.5">
                <Image
                  src={t.avatarUrl}
                  alt={t.author}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover border border-primary/30"
                />
                <div>
                  <h4 className="font-display text-body-sm font-bold text-foreground">
                    {t.author}
                  </h4>
                  <p className="text-[10px] font-display font-bold uppercase tracking-wider text-faint">
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
