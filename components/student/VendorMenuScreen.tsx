"use client";

import { useState } from "react";
import { MenuTopBar } from "@/components/student/MenuTopBar";
import { MenuInfoCard } from "@/components/student/MenuInfoCard";
import { MenuBrowser } from "@/components/student/MenuBrowser";
import { VendorInfoModal } from "@/components/student/VendorInfoModal";
import { VendorOffersBoard } from "@/components/student/VendorOffersBoard";
import { StudentRecommendationsSection } from "@/components/student/StudentRecommendationsSection";
import { CanteenImageCarousel } from "@/components/student/CanteenImageCarousel";
import { mockMenuCategories } from "@/lib/mock/menu";
import type { MockMenuItem } from "@/lib/mock/menu";
import type { CanteenActiveOffer } from "@/lib/supabase/data";

export interface VendorMenuScreenCanteenInfo {
  id: string;
  name: string;
  avgPrepMinutes: number;
  rating: number;
  ratingCount: string;
  isOpen: boolean;
  description: string;
  images: string[];
  operatingHours: string | null;
  pickupLocation: string | null;
  campusName: string | null;
}

/** Owns the header's search/info interaction state — the actual data
 * fetch stays server-side in the page component, this just wires the
 * header controls to the existing menu grid and a vendor-info panel. */
export function VendorMenuScreen({
  canteenInfo,
  items,
  offers,
}: {
  canteenInfo: VendorMenuScreenCanteenInfo;
  items: MockMenuItem[];
  offers: CanteenActiveOffer[];
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      <MenuTopBar
        title={canteenInfo.name}
        isSearchOpen={isSearchOpen}
        searchQuery={searchQuery}
        onOpenSearch={() => setIsSearchOpen(true)}
        onCloseSearch={handleCloseSearch}
        onSearchQueryChange={setSearchQuery}
        onOpenInfo={() => setIsInfoOpen(true)}
      />

      <main className="mx-auto max-w-4xl px-5 pt-6 pb-32 md:px-16 md:pt-8">
        <div className="relative mb-4 h-56 w-full overflow-hidden rounded-2xl border border-border-subtle md:h-72">
          <CanteenImageCarousel images={canteenInfo.images} alt={canteenInfo.name} />
        </div>

        <MenuInfoCard
          avgPrepMinutes={canteenInfo.avgPrepMinutes}
          rating={canteenInfo.rating}
          ratingCount={canteenInfo.ratingCount}
          isOpen={canteenInfo.isOpen}
          description={canteenInfo.description}
        />

        <VendorOffersBoard offers={offers} />

        <StudentRecommendationsSection />

        {items.length === 0 ? (
          <div className="mt-8 rounded-xl border border-border-subtle bg-surface-elevated p-6 text-center text-body-sm text-muted">
            No food items are currently available at this canteen.
          </div>
        ) : (
          <MenuBrowser
            canteenId={canteenInfo.id}
            canteenName={canteenInfo.name}
            items={items}
            categories={mockMenuCategories}
            searchQuery={searchQuery}
          />
        )}
      </main>

      <VendorInfoModal
        open={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        vendor={{
          name: canteenInfo.name,
          description: canteenInfo.description,
          avgPrepMinutes: canteenInfo.avgPrepMinutes,
          rating: canteenInfo.rating,
          ratingCount: canteenInfo.ratingCount,
          isOpen: canteenInfo.isOpen,
          operatingHours: canteenInfo.operatingHours,
          pickupLocation: canteenInfo.pickupLocation,
          campusName: canteenInfo.campusName,
        }}
      />
    </>
  );
}
