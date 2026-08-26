"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Testimonial } from "@/lib/mock/landing";

const SQRT_5000 = Math.sqrt(5000);

interface StaggerTestimonialsProps {
  testimonials: Testimonial[];
}

export function StaggerTestimonials({ testimonials }: StaggerTestimonialsProps) {
  const [cardOrder, setCardOrder] = useState(() =>
    testimonials.map((_, idx) => idx)
  );

  const moveNext = () => {
    setCardOrder((prev) => {
      const next = [...prev];
      next.unshift(next.pop() as number);
      return next;
    });
  };

  const movePrev = () => {
    setCardOrder((prev) => {
      const next = [...prev];
      next.push(next.shift() as number);
      return next;
    });
  };

  const handleCardClick = (position: number) => {
    for (let i = 0; i < position; i++) {
      moveNext();
    }
  };

  return (
    <div className="relative w-full">
      <div
        className="relative mx-auto w-full max-w-[420px] sm:max-w-[480px]"
        style={{ height: "340px" }}
      >
        {cardOrder.map((testimonialIdx, position) => {
          const testimonial = testimonials[testimonialIdx];
          const isActive = position === 0;
          const offset = position;

          return (
            <button
              key={testimonial.name}
              type="button"
              onClick={() => handleCardClick(position)}
              aria-label={
                isActive
                  ? `${testimonial.name}, ${testimonial.role}`
                  : `Show testimonial from ${testimonial.name}`
              }
              className={cn(
                "absolute left-1/2 top-1/2 flex h-[280px] w-[260px] sm:h-[300px] sm:w-[300px] -translate-x-1/2 -translate-y-1/2 flex-col justify-between rounded-2xl border p-5 sm:p-6 text-left shadow-2xl transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                isActive
                  ? "z-30 cursor-default border-primary/60 bg-surface-elevated shadow-glow-primary"
                  : "z-10 cursor-pointer border-border bg-surface hover:border-primary/40"
              )}
              style={{
                transform: `translate(-50%, -50%) translateX(${
                  offset * 40 * (offset % 2 === 0 ? 1 : -1)
                }px) translateY(${offset * 14}px) rotate(${
                  offset === 0 ? 0 : offset % 2 === 0 ? SQRT_5000 / 100 : -SQRT_5000 / 100
                }deg)`,
                opacity: offset > 2 ? 0 : 1,
                pointerEvents: offset > 2 ? "none" : "auto",
              }}
              tabIndex={offset > 2 ? -1 : 0}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "font-display text-[40px] leading-none",
                  isActive ? "text-primary/30" : "text-primary/10"
                )}
              >
                &ldquo;
              </span>

              <p
                className={cn(
                  "relative z-10 my-4 line-clamp-5 font-body text-sm leading-relaxed",
                  isActive ? "text-foreground/90" : "text-muted"
                )}
              >
                {testimonial.text}
              </p>

              <div className="flex items-center gap-3 border-t border-border/60 pt-3">
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary/30">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-foreground">
                    {testimonial.name}
                  </h4>
                  <p className="text-[10px] font-display font-bold uppercase tracking-wider text-primary">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={movePrev}
          aria-label="Previous testimonial"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={moveNext}
          aria-label="Next testimonial"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
