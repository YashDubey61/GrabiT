"use client";

import { useEffect, useState } from "react";
import type {
  RecommendationItem,
  StudentRecommendationsPayload,
} from "@/lib/supabase/student_recommendations";
import { trackProductEvent } from "@/lib/analytics/events";
import { useCart } from "@/lib/cart/CartContext";

export function StudentRecommendationsSection() {
  const [data, setData] = useState<StudentRecommendationsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const cart = useCart();

  useEffect(() => {
    let isSubscribed = true;

    async function loadRecommendations() {
      try {
        const res = await fetch("/api/student/recommendations");
        if (res.ok) {
          const json: StudentRecommendationsPayload = await res.json();
          if (isSubscribed) {
            setData(json);
            trackProductEvent({
              eventName: "recommendation_viewed",
              metadata: {
                count: json.recommendations.length,
                isPersonalized: json.isPersonalized,
                timeBucket: json.timeBucket,
              },
            });
          }
        }
      } catch (err) {
        console.error("Failed to load recommendations:", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    loadRecommendations();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const quantityOf = (itemId: string) => {
    return cart.items.find((i) => i.menuItemId === itemId)?.quantity ?? 0;
  };

  const handleAddToCart = (item: RecommendationItem, index: number) => {
    cart.addItem({
      canteenId: item.canteenId,
      canteenName: item.canteenName,
      menuItemId: item.itemId,
      name: item.title,
      price: item.price,
      image: item.imageUrl,
    });

    // Track recommendation click & cart addition (non-blocking)
    trackProductEvent({
      eventName: "recommendation_clicked",
      canteenId: item.canteenId,
      menuItemId: item.itemId,
      metadata: {
        category: item.category,
        position: index + 1,
        reason: item.reason,
      },
    });

    trackProductEvent({
      eventName: "recommendation_added_to_cart",
      canteenId: item.canteenId,
      menuItemId: item.itemId,
      metadata: {
        price: item.price,
        category: item.category,
      },
    });
  };

  const handleIncrement = (item: RecommendationItem, index: number) => {
    const currentQty = quantityOf(item.itemId);
    if (currentQty === 0) {
      handleAddToCart(item, index);
    } else {
      cart.increment(item.itemId);
    }
  };

  const handleDecrement = (item: RecommendationItem) => {
    cart.decrement(item.itemId);
  };

  if (loading) {
    return (
      <section className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-48 rounded bg-surface-elevated animate-pulse"></div>
          <div className="h-4 w-24 rounded bg-surface-elevated animate-pulse"></div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 touch-pan-y [::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="h-36 w-[230px] shrink-0 rounded-2xl bg-surface-elevated animate-pulse border border-border-subtle"></div>
          <div className="h-36 w-[230px] shrink-0 rounded-2xl bg-surface-elevated animate-pulse border border-border-subtle"></div>
          <div className="h-36 w-[230px] shrink-0 rounded-2xl bg-surface-elevated animate-pulse border border-border-subtle"></div>
        </div>
      </section>
    );
  }

  if (!data || data.recommendations.length === 0) {
    return null;
  }

  return (
    <section className="mb-6 space-y-3">
      {/* Fixed Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-body font-bold text-foreground">
          <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
          {data.isPersonalized ? "Recommended for You" : `Popular Around ${data.campusName}`}
        </h2>
        <span className="text-[11px] font-mono text-muted uppercase tracking-wider">
          {data.timeBucket} PICK
        </span>
      </div>

      {/* Horizontal Scrollable Cards Container */}
      <div className="flex overflow-x-auto gap-3 pb-2 pt-1 -mx-4 px-4 sm:-mx-6 sm:px-6 snap-x snap-mandatory touch-pan-y [::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {data.recommendations.map((item, idx) => {
          const quantity = quantityOf(item.itemId);
          return (
            <div
              key={item.itemId}
              className="w-[230px] sm:w-[250px] md:w-[270px] shrink-0 snap-start p-4 rounded-2xl bg-surface-elevated border border-border-subtle hover:border-primary/40 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold tracking-wider font-mono">
                    {item.category === "ORDER_AGAIN"
                      ? "ORDER AGAIN"
                      : item.category === "TRENDING_NOW"
                      ? "TRENDING"
                      : item.category === "TIME_OF_DAY"
                      ? "TIME OF DAY"
                      : "CAMPUS PICK"}
                  </span>
                  <h3 className="text-body font-bold text-foreground mt-1.5 group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </h3>
                  <p className="text-body-sm text-muted text-[11px] truncate">{item.canteenName}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-body font-bold text-foreground font-mono">₹{item.price}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs gap-1">
                <span className="text-[11px] text-muted italic flex items-center gap-1 min-w-0 truncate">
                  <span className="material-symbols-outlined text-sm text-primary shrink-0">local_offer</span>
                  <span className="truncate">{item.reason}</span>
                </span>

                {quantity === 0 ? (
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item, idx)}
                    aria-label={`Quick add ${item.title} to cart`}
                    className="px-3 py-1.5 rounded-xl font-display font-bold text-xs transition-all flex items-center gap-1 shrink-0 bg-primary text-black hover:bg-primary-hover shadow-[0_4px_16px_-4px_rgb(255_109_0_/_0.4)] active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-black font-bold" aria-hidden="true">
                      add
                    </span>
                    <span className="text-black font-bold">Quick Add</span>
                  </button>
                ) : (
                  <div
                    className="flex h-[28px] items-center gap-2 rounded-xl bg-primary px-2 text-black shadow-[0_4px_16px_-4px_rgb(255_109_0_/_0.4)] shrink-0 font-display font-bold text-xs"
                    role="group"
                    aria-label={`Quantity of ${item.title}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleDecrement(item)}
                      aria-label={`Remove one ${item.title}`}
                      className="flex h-full w-4 items-center justify-center text-black font-bold transition-transform active:scale-90 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] font-bold" aria-hidden="true">
                        remove
                      </span>
                    </button>
                    <span
                      className="min-w-[1ch] text-center font-mono font-bold text-xs text-black tabular-nums"
                      aria-live="polite"
                    >
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleIncrement(item, idx)}
                      aria-label={`Add one more ${item.title}`}
                      className="flex h-full w-4 items-center justify-center text-black font-bold transition-transform active:scale-90 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] font-bold" aria-hidden="true">
                        add
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
