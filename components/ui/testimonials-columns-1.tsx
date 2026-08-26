"use client";

import React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Testimonial } from "@/lib/mock/landing";

interface TestimonialsColumnProps {
  testimonials: Testimonial[];
  className?: string;
  duration?: number;
}

export function TestimonialsColumn({
  testimonials,
  className = "",
}: TestimonialsColumnProps) {
  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {testimonials.map((t, idx) => (
        <motion.div
          key={`${t.name}-${idx}`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: idx * 0.12 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="relative flex flex-col justify-between rounded-3xl border border-border/80 bg-surface-elevated/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-primary/40 hover:shadow-glow-primary/20 group"
        >
          <span
            className="material-symbols-outlined absolute top-6 right-6 text-[40px] text-primary/15 transition-colors group-hover:text-primary/30 pointer-events-none"
            aria-hidden="true"
          >
            format_quote
          </span>

          <p className="relative z-10 mb-6 font-body text-body-md text-foreground/90 leading-relaxed font-normal">
            &ldquo;{t.text}&rdquo;
          </p>

          <div className="flex items-center gap-3.5 pt-3 border-t border-border/40">
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary/30 group-hover:border-primary transition-colors">
              <Image
                src={t.image}
                alt={t.name}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div>
              <h4 className="font-display text-body-sm font-bold text-foreground group-hover:text-primary transition-colors">
                {t.name}
              </h4>
              <p className="text-[11px] font-display font-bold uppercase tracking-wider text-primary">
                {t.role}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
