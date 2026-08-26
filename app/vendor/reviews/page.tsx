"use client";

import { useEffect, useState, useCallback } from "react";
import { VendorHeader } from "@/components/vendor/orders/VendorHeader";
import { VendorMoreFeaturesSheet } from "@/components/vendor/orders/VendorMoreFeaturesSheet";
import { VendorMobileNavMenu } from "@/components/vendor/orders/VendorMobileNavMenu";
import { VendorProfileSheet } from "@/components/vendor/orders/VendorProfileSheet";
import { VENDOR_NAV } from "@/app/vendor/layout";
import { VendorNotificationsDrawer } from "@/components/vendor/notifications/VendorNotificationsDrawer";
import {
  getLiveVendorReviews,
  replyToVendorReview,
  reportVendorReview,
  type VendorReviewsData,
  type VendorReviewItem,
} from "@/lib/supabase/vendor_reviews";
import { useVendor } from "@/lib/vendor/VendorContext";
import { createClient } from "@/lib/supabase/client";
import { useOrderAlertSound } from "@/lib/vendor/useOrderAlertSound";

import { VendorReviewsOverviewCards } from "@/components/vendor/reviews/VendorReviewsOverviewCards";
import { VendorRatingBreakdownCard } from "@/components/vendor/reviews/VendorRatingBreakdownCard";
import { VendorReviewsFilterBar } from "@/components/vendor/reviews/VendorReviewsFilterBar";
import { VendorReviewCard } from "@/components/vendor/reviews/VendorReviewCard";
import { VendorReviewDetailModal } from "@/components/vendor/reviews/VendorReviewDetailModal";
import { VendorProductRatingInsights } from "@/components/vendor/reviews/VendorProductRatingInsights";

export default function VendorReviewsPage() {
  const { store, canteenId } = useVendor();
  const sound = useOrderAlertSound();

  const [data, setData] = useState<VendorReviewsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState("all");
  const [selectedResponseStatus, setSelectedResponseStatus] = useState("all");

  // Modals & Drawers
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMoreFeaturesOpen, setIsMoreFeaturesOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [selectedReviewForModal, setSelectedReviewForModal] = useState<VendorReviewItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const loadReviews = useCallback(
    async (rating = selectedRating, resStatus = selectedResponseStatus, query = searchQuery) => {
      setIsError(false);
      const res = await getLiveVendorReviews({
        rating,
        responseStatus: resStatus,
        searchQuery: query,
      });
      if (res.ok && res.data) {
        setData(res.data);
      } else {
        setIsError(true);
      }
      setIsLoading(false);
    },
    [selectedRating, selectedResponseStatus, searchQuery],
  );

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;

    if (!canteenId) return;

    loadReviews();

    const supabase = createClient();
    channel = supabase
      .channel(`vendor-reviews-realtime-${canteenId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_reviews", filter: `canteen_id=eq.${canteenId}` },
        () => {
          loadReviews();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [canteenId, loadReviews]);

  const handleSendReply = async (reviewId: string, replyText: string) => {
    const res = await replyToVendorReview(reviewId, replyText);
    if (res.ok) {
      showNotification("Response published to customer successfully.");
      loadReviews();
    } else {
      showNotification(res.error ?? "Failed to publish response.");
    }
  };

  const handleReportReview = async (reviewId: string, reason = "Inappropriate content") => {
    const res = await reportVendorReview(reviewId, reason);
    if (res.ok) {
      showNotification("Review reported to Super Admin moderation team.");
      loadReviews();
    } else {
      showNotification(res.error ?? "Failed to report review.");
    }
  };

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedRating("all");
    setSelectedResponseStatus("all");
  }, []);

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

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-32 sm:pb-8 flex flex-col gap-6">
        {notification && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-body-sm font-semibold text-primary animate-fade-in">
            {notification}
          </div>
        )}

        {/* Title */}
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-title font-extrabold text-foreground sm:text-display">
            Reviews & Customer Ratings
          </h1>
          <p className="text-caption text-muted">
            Customer feedback, star distribution, vendor responses & dish rating insights
          </p>
        </div>

        {/* Dashboard Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="material-symbols-outlined text-[36px] text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-body-sm text-muted">Fetching customer reviews & ratings from Supabase...</p>
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-12 text-center">
            <span className="material-symbols-outlined text-[40px] text-danger">error</span>
            <h3 className="font-display text-title font-bold text-foreground">
              Unable to load reviews
            </h3>
            <p className="text-caption text-muted">
              Check your network connection and try again.
            </p>
            <button
              type="button"
              onClick={() => loadReviews()}
              className="mt-2 rounded-xl bg-primary px-5 py-2.5 font-display text-caption font-bold text-on-primary"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Top Metrics Cards */}
            <VendorReviewsOverviewCards metrics={data.metrics} />

            {/* Rating Breakdown & Product Leaderboard */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div>
                <VendorRatingBreakdownCard
                  metrics={data.metrics}
                  distribution={data.ratingDistribution}
                  selectedRating={selectedRating}
                  onSelectRatingFilter={(r) => {
                    setSelectedRating(r);
                    loadReviews(r, selectedResponseStatus, searchQuery);
                  }}
                />
              </div>

              <div className="lg:col-span-2">
                <VendorProductRatingInsights
                  highestRated={data.productInsights.highestRated}
                  lowestRated={data.productInsights.lowestRated}
                />
              </div>
            </div>

            {/* Filter Toolbar */}
            <VendorReviewsFilterBar
              searchQuery={searchQuery}
              onSearchChange={(q) => {
                setSearchQuery(q);
                loadReviews(selectedRating, selectedResponseStatus, q);
              }}
              selectedRating={selectedRating}
              onRatingChange={(r) => {
                setSelectedRating(r);
                loadReviews(r, selectedResponseStatus, searchQuery);
              }}
              selectedResponseStatus={selectedResponseStatus}
              onResponseStatusChange={(s) => {
                setSelectedResponseStatus(s);
                loadReviews(selectedRating, s, searchQuery);
              }}
              onResetFilters={handleResetFilters}
              filteredCount={data.reviews.length}
              totalCount={data.metrics.totalReviews}
            />

            {/* Review Cards Grid */}
            {data.reviews.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface-elevated/70 p-8 text-center backdrop-blur-md flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-[40px] text-muted">
                  rate_review
                </span>
                <h3 className="font-display text-body-sm font-bold text-foreground">
                  {data.metrics.totalReviews === 0
                    ? "No customer reviews yet"
                    : "No reviews matching your search or filters"}
                </h3>
                <p className="text-caption text-muted max-w-sm">
                  {data.metrics.totalReviews === 0
                    ? "As students complete orders, their star ratings and review feedback will appear here."
                    : "Try resetting your search query or filter selection."}
                </p>
                {data.metrics.totalReviews > 0 && (
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
                {data.reviews.map((review) => (
                  <VendorReviewCard
                    key={review.id}
                    review={review}
                    onOpenDetailModal={(r) => {
                      setSelectedReviewForModal(r);
                      setIsDetailModalOpen(true);
                    }}
                    onReportReview={(rId) => handleReportReview(rId)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <VendorReviewDetailModal
        review={selectedReviewForModal}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedReviewForModal(null);
        }}
        onSendReply={handleSendReply}
        onReport={handleReportReview}
      />

      <VendorNotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectOrder={() => {}}
      />
    </div>
  );
}
