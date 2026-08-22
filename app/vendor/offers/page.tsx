"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { MOCK_VENDOR_STORE } from "@/lib/mock/vendor";
import { VendorHeader } from "@/components/vendor/orders/VendorHeader";
import { VendorMoreFeaturesSheet } from "@/components/vendor/orders/VendorMoreFeaturesSheet";
import { VendorMobileNavMenu } from "@/components/vendor/orders/VendorMobileNavMenu";
import { VendorProfileSheet } from "@/components/vendor/orders/VendorProfileSheet";
import { VENDOR_NAV } from "@/app/vendor/layout";
import { VendorNotificationsDrawer } from "@/components/vendor/notifications/VendorNotificationsDrawer";
import { VendorOffersStatsCards } from "@/components/vendor/offers/VendorOffersStatsCards";
import { VendorOffersFilterBar } from "@/components/vendor/offers/VendorOffersFilterBar";
import { VendorOfferCard } from "@/components/vendor/offers/VendorOfferCard";
import { VendorCreateOfferModal } from "@/components/vendor/offers/VendorCreateOfferModal";
import { VendorOfferRedemptionsModal } from "@/components/vendor/offers/VendorOfferRedemptionsModal";
import {
  getLiveVendorOffers,
  createLiveVendorOffer,
  updateLiveVendorOffer,
  deleteLiveVendorOffer,
  getLiveVendorOfferRedemptions,
  type VendorOffer,
  type OfferRedemptionLog,
} from "@/lib/supabase/vendor_offers";
import {
  getLiveVendorCanteenId,
  getLiveVendorShopName,
} from "@/lib/supabase/vendor_context";
import { createClient } from "@/lib/supabase/client";
import { useOrderAlertSound } from "@/lib/vendor/useOrderAlertSound";

export default function VendorOffersPage() {
  const sound = useOrderAlertSound();
  const [store, setStore] = useState(MOCK_VENDOR_STORE);
  const [offers, setOffers] = useState<VendorOffer[]>([]);
  const [stats, setStats] = useState({
    activeOffersCount: 0,
    scheduledOffersCount: 0,
    expiredOffersCount: 0,
    totalRedemptions: 0,
    totalDiscountGiven: 0,
    totalRevenueGenerated: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Modals & Drawers
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMoreFeaturesOpen, setIsMoreFeaturesOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<VendorOffer | null>(null);

  const [selectedOfferForRedemptions, setSelectedOfferForRedemptions] = useState<VendorOffer | null>(null);
  const [redemptions, setRedemptions] = useState<OfferRedemptionLog[]>([]);
  const [isLoadingRedemptions, setIsLoadingRedemptions] = useState(false);
  const [isRedemptionsModalOpen, setIsRedemptionsModalOpen] = useState(false);

  const canteenIdRef = useRef<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadOffers = useCallback(async () => {
    setIsError(false);
    try {
      const res = await getLiveVendorOffers();
      setOffers(res.offers);
      setStats(res.stats);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    const supabase = createClient();

    getLiveVendorShopName().then((name) => {
      if (isMounted && name) {
        setStore((prev) => ({ ...prev, name }));
      }
    });

    getLiveVendorCanteenId().then((canteenId) => {
      if (!isMounted) return;
      canteenIdRef.current = canteenId;

      loadOffers();

      if (!canteenId) return;

      channel = supabase
        .channel(`vendor-offers-realtime-${canteenId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "promo_codes", filter: `canteen_id=eq.${canteenId}` },
          () => {
            loadOffers();
          },
        )
        .subscribe();
    });

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadOffers]);

  // Filtered offers
  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.code.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q);

      const matchesStatus =
        selectedStatus === "all" || o.status === selectedStatus;

      const matchesType =
        selectedType === "all" || o.discountType === selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [offers, searchQuery, selectedStatus, selectedType]);

  const handleToggleActive = async (offerId: string, isActive: boolean) => {
    const target = offers.find((o) => o.id === offerId);
    const res = await updateLiveVendorOffer(offerId, { isActive });
    if (res.ok) {
      showNotification(`Offer "${target?.code ?? "Coupon"}" ${isActive ? "ACTIVATED" : "PAUSED"}`);
      loadOffers();
    } else {
      showNotification(res.error ?? "Failed to toggle offer status.");
    }
  };

  const handleSaveOffer = async (payload: {
    id?: string;
    code: string;
    description?: string;
    discountType: "PERCENTAGE" | "FLAT";
    discountValue: number;
    maxDiscount?: number;
    minOrderValue?: number;
    usageLimit?: number;
    perUserLimit?: number;
    startsAt?: string;
    expiresAt?: string;
    isActive?: boolean;
  }) => {
    if (payload.id) {
      const res = await updateLiveVendorOffer(payload.id, payload);
      if (res.ok) {
        showNotification(`Coupon "${payload.code}" updated successfully`);
        loadOffers();
      } else {
        showNotification(res.error ?? "Failed to update offer.");
      }
    } else {
      const res = await createLiveVendorOffer(payload);
      if (res.ok) {
        showNotification(`Coupon "${payload.code}" published successfully`);
        loadOffers();
      } else {
        showNotification(res.error ?? "Failed to create offer.");
      }
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    const target = offers.find((o) => o.id === offerId);
    const res = await deleteLiveVendorOffer(offerId);
    if (res.ok) {
      showNotification(`Coupon "${target?.code ?? "Offer"}" deleted.`);
      loadOffers();
    } else {
      showNotification(res.error ?? "Failed to delete offer.");
    }
  };

  const handleViewRedemptions = async (offer: VendorOffer) => {
    setSelectedOfferForRedemptions(offer);
    setIsRedemptionsModalOpen(true);
    setIsLoadingRedemptions(true);
    const redData = await getLiveVendorOfferRedemptions(offer.id);
    setRedemptions(redData);
    setIsLoadingRedemptions(false);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedType("all");
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <VendorHeader
        store={store}
        onToggleStatus={() => {}}
        onChangePrepTime={() => {}}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenMoreFeatures={() => setIsMoreFeaturesOpen(true)}
        onOpenNavMenu={() => setIsNavMenuOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <VendorMobileNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        items={VENDOR_NAV}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <VendorMoreFeaturesSheet
        isOpen={isMoreFeaturesOpen}
        onClose={() => setIsMoreFeaturesOpen(false)}
        store={store}
        onToggleStatus={() => {}}
        onChangePrepTime={() => {}}
        isSoundUnlocked={sound.isUnlocked}
        onUnlockSound={sound.unlock}
      />

      <VendorProfileSheet
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        store={store}
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-24 sm:pb-8 flex flex-col gap-6">
        {notification && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-body-sm font-semibold text-primary animate-fade-in">
            {notification}
          </div>
        )}

        {/* Title & Top Action */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-title font-extrabold text-foreground sm:text-display">
              Offers & Promotions
            </h1>
            <p className="text-caption text-muted">
              Create vendor-scoped promo codes, discount deals & redemption tracking
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingOffer(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-body-sm font-extrabold text-on-primary shadow-glow-primary hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create New Offer
          </button>
        </div>

        {/* Offers Statistics Dashboard */}
        <VendorOffersStatsCards stats={stats} />

        {/* Search & Filters */}
        <VendorOffersFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          onResetFilters={handleResetFilters}
          filteredCount={filteredOffers.length}
          totalCount={offers.length}
        />

        {/* Offers Cards Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined text-[32px] text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-body-sm text-muted">Loading live promotional offers from Supabase...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-12 text-center">
            <span className="material-symbols-outlined text-[40px] text-danger">error</span>
            <h3 className="font-display text-title font-bold text-foreground">
              Unable to load offers
            </h3>
            <p className="text-caption text-muted">
              Check your network connection and try again.
            </p>
            <button
              type="button"
              onClick={loadOffers}
              className="mt-2 rounded-xl bg-primary px-5 py-2.5 font-display text-caption font-bold text-on-primary"
            >
              Retry Load
            </button>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-elevated/70 p-8 text-center backdrop-blur-md flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[40px] text-muted">
              local_offer
            </span>
            <h3 className="font-display text-body-sm font-bold text-foreground">
              {offers.length === 0 ? "No active promotional offers" : "No offers matching search or filters"}
            </h3>
            <p className="text-caption text-muted max-w-sm">
              {offers.length === 0
                ? "Publish discount coupons to boost campus sales and reward loyal students."
                : "Try resetting your search query or filter selection."}
            </p>
            {offers.length === 0 ? (
              <button
                type="button"
                onClick={() => {
                  setEditingOffer(null);
                  setIsCreateModalOpen(true);
                }}
                className="mt-2 rounded-xl bg-primary px-5 py-2.5 font-display text-caption font-extrabold uppercase tracking-wider text-on-primary shadow-glow-primary"
              >
                Create Your First Offer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-1 font-display text-caption font-bold text-primary underline underline-offset-4"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOffers.map((offer) => (
              <VendorOfferCard
                key={offer.id}
                offer={offer}
                onToggleActive={handleToggleActive}
                onEditOffer={(o) => {
                  setEditingOffer(o);
                  setIsCreateModalOpen(true);
                }}
                onDeleteOffer={handleDeleteOffer}
                onViewRedemptions={handleViewRedemptions}
              />
            ))}
          </div>
        )}
      </main>

      <VendorCreateOfferModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingOffer(null);
        }}
        onSave={handleSaveOffer}
        editingOffer={editingOffer}
      />

      <VendorOfferRedemptionsModal
        offer={selectedOfferForRedemptions}
        isOpen={isRedemptionsModalOpen}
        onClose={() => {
          setIsRedemptionsModalOpen(false);
          setSelectedOfferForRedemptions(null);
        }}
        redemptions={redemptions}
        isLoading={isLoadingRedemptions}
      />

      <VendorNotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectOrder={() => {}}
      />
    </div>
  );
}
