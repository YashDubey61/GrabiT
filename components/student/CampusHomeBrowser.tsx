"use client";

import { useMemo, useState } from "react";
import { CategoryChips } from "@/components/student/CategoryChips";
import { CanteenCard } from "@/components/student/CanteenCard";
import type { MockCanteen, MockCanteenCategory } from "@/lib/mock/campus";

/**
 * Owns the only real interaction on Campus Home: stall category
 * filtering. Kept as one small client island rather than making the
 * whole page a client component — the header, status banner, and
 * search input above it stay server-rendered.
 */
export function CampusHomeBrowser({
  canteens,
  categories,
}: {
  canteens: MockCanteen[];
  categories: { id: MockCanteenCategory; label: string }[];
}) {
  const [selected, setSelected] = useState<MockCanteenCategory>("all");

  const visibleCanteens = useMemo(
    () =>
      selected === "all"
        ? canteens
        : canteens.filter((canteen) => canteen.category === selected),
    [canteens, selected],
  );

  return (
    <>
      <section className="mb-6">
        <CategoryChips
          categories={categories}
          selected={selected}
          onSelect={setSelected}
        />
      </section>

      <section className="grid grid-cols-1 gap-4">
        {visibleCanteens.map((canteen) => (
          <CanteenCard key={canteen.id} canteen={canteen} />
        ))}
        {visibleCanteens.length === 0 && (
          <p className="py-12 text-center text-body text-muted">
            No stalls in this category right now.
          </p>
        )}
      </section>
    </>
  );
}
