"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { CampusHeader } from "@/components/student/CampusHeader";
import { CanteenStatusBanner } from "@/components/student/CanteenStatusBanner";
import { CategoryChips } from "@/components/student/CategoryChips";
import { CanteenCard } from "@/components/student/CanteenCard";
import { CampusSelectorModal } from "@/components/student/CampusSelectorModal";
import { StudentRecommendationsSection } from "@/components/student/StudentRecommendationsSection";
import { CartBar } from "@/components/student/CartBar";
import { useCart } from "@/lib/cart/CartContext";

import {
  getLiveCampusList,
  getLiveCampusDetails,
  getLiveCampusCanteens,
  type SupabaseCampus,
} from "@/lib/supabase/data";

import {
  getCurrentBrowserLocation,
  detectCampusWithGoogle,
  type CampusLocationItem,
} from "@/lib/utils/geolocation";

import { mockCanteenCategories, type MockCanteen, type MockCanteenCategory } from "@/lib/mock/campus";

const SAVED_CAMPUS_KEY = "grabit_selected_campus_id";

type CampusDetails = { id: string; name: string; canteensOpen: number; estWaitMinutes: number };

export function StudentDashboardClient({
  initialCampuses,
  initialCampusDetails,
  initialCanteens,
}: {
  initialCampuses: SupabaseCampus[];
  initialCampusDetails: CampusDetails | null;
  initialCanteens: MockCanteen[];
}) {
  const [campuses, setCampuses] = useState<SupabaseCampus[]>(initialCampuses);
  const [activeCampus, setActiveCampus] = useState<{ id: string; name: string } | null>(
    initialCampusDetails,
  );
  const [canteenStats, setCanteenStats] = useState({
    canteensOpen: initialCampusDetails?.canteensOpen ?? 0,
    estWaitMinutes: initialCampusDetails?.estWaitMinutes ?? 0,
  });
  const [canteens, setCanteens] = useState<MockCanteen[]>(initialCanteens);
  const [isLoadingCanteens, setIsLoadingCanteens] = useState(false);

  // Shared cart — same store the Menu screen and Checkout read from.
  const cart = useCart();
  // Cart clears canteenName the instant the last item is removed, which
  // would cut the CartBar's exit animation off mid-fade — so remember the
  // last known name/total to render while it animates out.
  const [lastCartSnapshot, setLastCartSnapshot] = useState<{ canteenName: string; total: number; itemCount: number } | null>(null);
  useEffect(() => {
    if (cart.canteenName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastCartSnapshot({ canteenName: cart.canteenName, total: cart.subtotal, itemCount: cart.itemCount });
    }
  }, [cart.canteenName, cart.subtotal, cart.itemCount]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MockCanteenCategory>("all");

  // Geolocation & Modal State
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load campus details & canteens when active campus changes
  const loadCampusData = useCallback(async (campusId: string) => {
    setIsLoadingCanteens(true);
    try {
      const [details, canteenList] = await Promise.all([
        getLiveCampusDetails(campusId),
        getLiveCampusCanteens(campusId),
      ]);

      if (details) {
        setActiveCampus({ id: details.id, name: details.name });
        setCanteenStats({
          canteensOpen: details.canteensOpen,
          estWaitMinutes: details.estWaitMinutes,
        });
      } else {
        setActiveCampus(null);
        setCanteenStats({ canteensOpen: 0, estWaitMinutes: 0 });
      }
      setCanteens(canteenList);
    } catch {
      setActiveCampus(null);
      setCanteens([]);
    } finally {
      setIsLoadingCanteens(false);
    }
  }, []);

  // Automatic Location Detection Flow using Google Maps Platform & Haversine Geofencing
  const triggerAutoDetection = useCallback(async (campusList: SupabaseCampus[]) => {
    setIsDetectingLocation(true);
    setLocationStatusMessage(undefined);

    const { result, errorStatus } = await getCurrentBrowserLocation(6000);

    if (result) {
      const campusItems: CampusLocationItem[] = campusList.map((c) => ({
        id: c.id,
        name: c.name,
        city: c.city,
        latitude: c.latitude,
        longitude: c.longitude,
        radiusMeters: c.radius_meters,
      }));

      const detection = await detectCampusWithGoogle(
        result.latitude,
        result.longitude,
        result.accuracy,
        campusItems,
      );

      setIsDetectingLocation(false);

      if (detection.detectedCampus) {
        setLocationStatusMessage(undefined);
        loadCampusData(detection.detectedCampus.id);
        return;
      } else {
        setLocationStatusMessage("No GRABIT campus detected nearby. Please select manually.");
      }
    } else {
      setIsDetectingLocation(false);
      if (errorStatus === "DENIED") {
        setLocationStatusMessage("Location access is disabled. Choose your campus manually.");
      } else if (errorStatus === "TIMEOUT") {
        setLocationStatusMessage("Location request timed out. Please choose your campus.");
      } else {
        setLocationStatusMessage("Location unavailable. Select your campus below.");
      }
    }
  }, [loadCampusData]);

  // Initial Load: Fetch campus list & check for stored selection or auto GPS
  useEffect(() => {
    async function init() {
      const liveCampuses = await getLiveCampusList();
      setCampuses(liveCampuses);

      const savedId = typeof window !== "undefined" ? localStorage.getItem(SAVED_CAMPUS_KEY) : null;

      if (savedId) {
        const found = liveCampuses.find((c) => c.id === savedId);
        if (found) {
          loadCampusData(found.id);
          return;
        }
      }

      // No manual selection saved -> run auto GPS detection
      triggerAutoDetection(liveCampuses);
    }

    init();
  }, [loadCampusData, triggerAutoDetection]);

  // Handle manual campus selection
  const handleSelectCampus = (campus: SupabaseCampus) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SAVED_CAMPUS_KEY, campus.id);
    }
    setLocationStatusMessage(undefined);
    loadCampusData(campus.id);
  };

  // Filter canteens strictly within active campus by category & search query
  const filteredCanteens = useMemo(() => {
    return canteens.filter((canteen) => {
      const matchesCategory =
        selectedCategory === "all" || canteen.category === selectedCategory;

      const matchesSearch =
        !searchQuery.trim() ||
        canteen.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        canteen.cuisineTags.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [canteens, selectedCategory, searchQuery]);

  if (!activeCampus) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 text-center">
        <span className="material-symbols-outlined text-[48px] text-muted mb-3">school</span>
        <p className="font-display text-body-sm font-bold text-foreground">
          No campus is available yet.
        </p>
        <p className="mt-1 font-body text-caption text-muted">
          Please check back later or contact your GRABIT campus admin.
        </p>
      </main>
    );
  }

  return (
    <>
      <CampusHeader
        campusName={activeCampus.name}
        isDetecting={isDetectingLocation}
        onOpenCampusSelector={() => setIsModalOpen(true)}
      />

      <main
        className={`mx-auto max-w-2xl px-5 pt-20 md:px-16 md:pt-24 ${
          cart.itemCount > 0 ? "pb-32" : "pb-10"
        }`}
      >
        {/* Dynamic Canteen Status Banner */}
        <CanteenStatusBanner
          canteensOpen={canteenStats.canteensOpen}
          estWaitMinutes={canteenStats.estWaitMinutes}
        />

        {/* Hero & Search Section */}
        <section className="mb-6 space-y-4">
          <h1 className="text-balance font-display text-[28px] font-700 leading-[1.2] tracking-tight text-foreground md:text-display">
            Fuel your <span className="italic text-primary">hustle.</span>
          </h1>

          <div className="group relative">
            <span
              className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            >
              search
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeCampus.name} stalls or dishes...`}
              aria-label="Search stalls or dishes"
              className="w-full rounded-xl border border-border-subtle bg-surface-elevated py-4 pl-12 pr-4 text-body text-foreground outline-none transition-all placeholder:text-muted focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </section>

        {/* Recommendations */}
        <StudentRecommendationsSection />

        {/* Category Chips */}
        <section className="mb-6">
          <CategoryChips
            categories={mockCanteenCategories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </section>

        {/* Canteen Cards Grid */}
        <section className="grid grid-cols-1 gap-4">
          {isLoadingCanteens ? (
            <div className="py-12 text-center text-primary">
              <span className="material-symbols-outlined animate-spin text-[36px]">
                progress_activity
              </span>
              <p className="mt-2 font-display text-caption font-bold text-muted">
                Loading stalls for {activeCampus.name}...
              </p>
            </div>
          ) : (
            <>
              {filteredCanteens.map((canteen) => (
                <CanteenCard key={canteen.id} canteen={canteen} />
              ))}

              {filteredCanteens.length === 0 && (
                <div className="rounded-2xl border border-border bg-surface-elevated p-8 text-center">
                  <span className="material-symbols-outlined text-[40px] text-muted mb-2">
                    storefront
                  </span>
                  <p className="font-display text-body-sm font-bold text-foreground">
                    No food stalls available
                  </p>
                  <p className="mt-1 font-body text-caption text-muted">
                    {searchQuery
                      ? `No stalls match "${searchQuery}" at ${activeCampus.name}.`
                      : `No active canteens open at ${activeCampus.name} right now.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 font-display text-caption font-bold text-primary hover:bg-primary/20 transition-colors"
                  >
                    Switch Campus
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {lastCartSnapshot && (
        <CartBar
          canteenName={lastCartSnapshot.canteenName}
          itemCount={cart.itemCount > 0 ? cart.itemCount : lastCartSnapshot.itemCount}
          total={cart.itemCount > 0 ? cart.subtotal : lastCartSnapshot.total}
          visible={cart.itemCount > 0}
        />
      )}

      {/* Interactive Campus Selector Modal */}
      <CampusSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campuses={campuses}
        selectedCampusId={activeCampus.id}
        onSelectCampus={handleSelectCampus}
        onDetectLocation={() => triggerAutoDetection(campuses)}
        isDetectingLocation={isDetectingLocation}
        locationStatusMessage={locationStatusMessage}
      />
    </>
  );
}
