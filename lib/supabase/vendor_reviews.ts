export interface VendorReviewItem {
  id: string;
  orderId: string;
  orderNumber: string;
  canteenId: string;
  studentName?: string;
  menuItemId?: string;
  menuItemName?: string;
  menuItemImageUrl?: string;
  rating: number; // 1 to 5
  reviewText: string;
  vendorReply?: string;
  vendorRepliedAtIso?: string;
  reportStatus: "none" | "reported" | "flagged" | "hidden";
  reportReason?: string;
  createdAtIso: string;
}

export interface ProductRatingInsight {
  menuItemId: string;
  name: string;
  category: string;
  imageUrl: string;
  avgRating: number;
  totalReviews: number;
  fiveStarPercent: number;
}

export interface VendorReviewsData {
  metrics: {
    overallRating: number;
    totalReviews: number;
    fiveStarCount: number;
    fourStarCount: number;
    threeStarCount: number;
    twoStarCount: number;
    oneStarCount: number;
    responseRatePercent: number;
    avgRatingThisMonth: number;
  };
  ratingDistribution: {
    fiveStarPct: number;
    fourStarPct: number;
    threeStarPct: number;
    twoStarPct: number;
    oneStarPct: number;
  };
  ratingTrend: Array<{
    dateStr: string;
    label: string;
    avgRating: number;
    reviewsCount: number;
  }>;
  productInsights: {
    highestRated: ProductRatingInsight[];
    lowestRated: ProductRatingInsight[];
    allProducts: ProductRatingInsight[];
  };
  feedbackInsights: {
    positiveKeywords: string[];
    negativeKeywords: string[];
    topPraisedDishes: string[];
  };
  reviews: VendorReviewItem[];
}

export async function getLiveVendorReviews(filters?: {
  rating?: string;
  responseStatus?: string;
  searchQuery?: string;
  timeframe?: string;
}): Promise<{ ok: boolean; data?: VendorReviewsData; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (filters?.rating) params.set("rating", filters.rating);
    if (filters?.responseStatus) params.set("responseStatus", filters.responseStatus);
    if (filters?.searchQuery) params.set("searchQuery", filters.searchQuery);
    if (filters?.timeframe) params.set("timeframe", filters.timeframe);

    const res = await fetch(`/api/vendor/reviews?${params.toString()}`, {
      headers: { "Cache-Control": "no-cache" },
    });
    const result = await res.json();
    if (!res.ok || !result.ok) {
      return { ok: false, error: result.error ?? "Failed to fetch reviews." };
    }
    return { ok: true, data: result.data };
  } catch (err) {
    console.error("Fetch vendor reviews error:", err);
    return { ok: false, error: "Network error loading reviews." };
  }
}

export async function replyToVendorReview(
  reviewId: string,
  replyText: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/vendor/reviews/${reviewId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ replyText }),
    });
    const result = await res.json();
    if (!res.ok || !result.ok) {
      return { ok: false, error: result.error ?? "Failed to send response." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error submitting vendor reply." };
  }
}

export async function reportVendorReview(
  reviewId: string,
  reason: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/vendor/reviews/${reviewId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const result = await res.json();
    if (!res.ok || !result.ok) {
      return { ok: false, error: result.error ?? "Failed to report review." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error submitting review report." };
  }
}
