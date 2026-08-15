"use client";

import { useEffect, useState } from "react";
import type {
  RecommendationItem,
  StudentRecommendationsPayload,
} from "@/lib/supabase/student_recommendations";
import { trackProductEvent } from "@/lib/analytics/events";

export function StudentRecommendationsSection() {
  const [data, setData] = useState<StudentRecommendationsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [addedItem, setAddedItem] = useState<string | null>(null);

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

  const handleAddToCart = (item: RecommendationItem, index: number) => {
    setAddedItem(item.itemId);
    setTimeout(() => setAddedItem(null), 1500);

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

  if (loading) {
    return (
      <section className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 bg-surface-elevated rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-28 rounded-2xl bg-surface-elevated animate-pulse border border-border-subtle"></div>
          <div className="h-28 rounded-2xl bg-surface-elevated animate-pulse border border-border-subtle"></div>
        </div>
      </section>
    );
  }

  if (!data || data.recommendations.length === 0) {
    return null;
  }

  return (
    <section className="mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-body font-bold text-foreground flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
          {data.isPersonalized ? "Recommended for You" : `Popular Around ${data.campusName}`}
        </h2>
        <span className="text-[11px] font-mono text-muted uppercase">
          {data.timeBucket} PICK
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.recommendations.map((item, idx) => (
          <div
            key={item.itemId}
            className="p-4 rounded-2xl bg-surface-elevated border border-border-subtle hover:border-primary/40 transition-all flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold tracking-wider font-mono">
                  {item.category === "ORDER_AGAIN"
                    ? "ORDER AGAIN"
                    : item.category === "TRENDING_NOW"
                    ? "TRENDING"
                    : item.category === "TIME_OF_DAY"
                    ? "TIME OF DAY"
                    : "CAMPUS PICK"}
                </span>
                <h3 className="text-body font-bold text-foreground mt-1.5 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-body-sm text-muted text-[11px]">{item.canteenName}</p>
              </div>

              <div className="text-right">
                <span className="text-body font-bold text-foreground font-mono">₹{item.price}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
              <span className="text-[11px] text-muted italic flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-primary">local_offer</span>
                {item.reason}
              </span>

              <button
                onClick={() => handleAddToCart(item, idx)}
                className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-1 ${
                  addedItem === item.itemId
                    ? "bg-emerald-600 text-white shadow-md"
                    : "bg-primary text-white hover:bg-primary/90 shadow-md"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {addedItem === item.itemId ? "check" : "add"}
                </span>
                {addedItem === item.itemId ? "Added!" : "Quick Add"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
