"use client";

import { useRef, useState, useMemo } from "react";
import Image from "next/image";
import { resolveImageUrl, DEFAULT_CANTEEN_IMAGE } from "@/lib/utils/image";

const SWIPE_THRESHOLD_PX = 40;

/** Horizontal, touch-friendly image carousel for a vendor card's
 * cafeteria photo area. Single-image vendors render a plain image with
 * no dots/gestures. Contained entirely within its parent's box
 * (overflow-hidden here, object-cover on each slide) — never expands
 * the card. Click-through to the card's own <Link> is preserved;
 * swipe gestures stop propagation so a drag never also navigates. */
export function CanteenImageCarousel({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [errored, setErrored] = useState<Record<number, boolean>>({});
  const [fallbackAttempted, setFallbackAttempted] = useState<Record<number, boolean>>({});
  const touchStartX = useRef<number | null>(null);

  // Normalize image URLs through the centralized resolver
  const validImages = useMemo(() => {
    if (!Array.isArray(images) || images.length === 0) {
      return [DEFAULT_CANTEEN_IMAGE];
    }
    const resolved = images
      .map((img) => resolveImageUrl(img, "canteen"))
      .filter(Boolean);
    return resolved.length > 0 ? resolved : [DEFAULT_CANTEEN_IMAGE];
  }, [images]);

  const hasMultiple = validImages.length > 1;

  const goTo = (next: number) => {
    setIndex(Math.max(0, Math.min(validImages.length - 1, next)));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    if (deltaX < 0) {
      goTo(index + 1); // swipe left → next
    } else {
      goTo(index - 1); // swipe right → previous
    }
  };

  return (
    <div
      className="relative h-full w-full touch-pan-y overflow-hidden bg-surface-elevated"
      onTouchStart={hasMultiple ? handleTouchStart : undefined}
      onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
    >
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{
          // The track is validImages.length × 100% wide, so a percentage
          // transform here is relative to that scaled width, not one slide.
          // Dividing by the slide count converts "move `index` slides" into
          // the correct percentage of the track's own box (e.g. index=1 of
          // 4 slides needs -25%, not -100%, to shift by exactly one slide).
          transform: `translateX(-${(index * 100) / validImages.length}%)`,
          width: `${validImages.length * 100}%`,
        }}
      >
        {validImages.map((src, i) => {
          const activeSrc = fallbackAttempted[i] ? DEFAULT_CANTEEN_IMAGE : src;

          return (
            <div
              key={`${src}_${i}`}
              className="relative h-full shrink-0 overflow-hidden bg-surface-elevated"
              style={{ width: `${100 / validImages.length}%` }}
            >
              {!loaded[i] && !errored[i] && (
                <div className="absolute inset-0 animate-pulse bg-surface-elevated" />
              )}

              {errored[i] ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-surface-elevated via-surface to-background p-4 text-center">
                  <span className="material-symbols-outlined text-[36px] text-muted/60 mb-1">
                    storefront
                  </span>
                  <span className="font-display text-caption font-bold text-muted">
                    {alt}
                  </span>
                  <span className="text-[11px] text-faint">Photo Unavailable</span>
                </div>
              ) : (
                <Image
                  src={activeSrc}
                  alt={`${alt} — photo ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 768px) 640px, 100vw"
                  className="object-cover"
                  loading={i === 0 || Math.abs(i - index) <= 1 ? "eager" : "lazy"}
                  onLoad={() => setLoaded((prev) => ({ ...prev, [i]: true }))}
                  onError={() => {
                    if (!fallbackAttempted[i] && activeSrc !== DEFAULT_CANTEEN_IMAGE) {
                      setFallbackAttempted((prev) => ({ ...prev, [i]: true }));
                    } else {
                      setErrored((prev) => ({ ...prev, [i]: true }));
                    }
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {hasMultiple && (
        <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {validImages.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to photo ${i + 1}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goTo(i);
              }}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-primary" : "w-1.5 bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
