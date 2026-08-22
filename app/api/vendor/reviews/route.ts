import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import type {
  VendorReviewsData,
  VendorReviewItem,
  ProductRatingInsight,
} from "@/lib/supabase/vendor_reviews";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ratingFilter = searchParams.get("rating");
    const responseStatus = searchParams.get("responseStatus");
    const searchQuery = searchParams.get("searchQuery");

    // 1. Authorize Vendor Context Server-Side
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Please sign in with a vendor account." },
        { status: 401 },
      );
    }
    const canteenId = vendorCtx.canteenId;
    const supabase = getSupabaseAdminClient();

    // 2. Fetch All Reviews for this Canteen
    const { data: dbReviews, error: reviewsErr } = await supabase
      .from("order_reviews")
      .select(`
        *,
        orders ( id, order_number, order_items ( item_id, item_name, quantity ) ),
        menu_items ( id, name, category, price, image_url )
      `)
      .eq("canteen_id", canteenId)
      .order("created_at", { ascending: false });

    if (reviewsErr) {
      console.error("Fetch order reviews error:", reviewsErr);
    }

    const allReviewsList = dbReviews ?? [];

    // Also fetch canteen menu items for product insights metadata
    const { data: dbMenuItems } = await supabase
      .from("menu_items")
      .select("id, name, category, image_url")
      .eq("canteen_id", canteenId);

    const allCanteenMenuItemsMap = new Map<string, { name: string; category: string; imageUrl: string }>();
    if (dbMenuItems) {
      for (const item of dbMenuItems) {
        allCanteenMenuItemsMap.set(item.id, {
          name: item.name,
          category: item.category ?? "General",
          imageUrl:
            item.image_url ||
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAYyDJlcK1nzWWPU_aB5kKEETdxvuuCOxgmobxGOiNATAry3Q921sbG4Zc-RcUfIRzmbDp0HxRN1lBQCD-Nnq0K9OUiw307FYg1kadsbQIZBIkV_kboiV10jJa4WqKep6XhuawSxlM6aFcq2ozJ-VPVkobP5PC8kwWLfG8iRu4qBPa4q5SwM1ANvJbmQVUzReCOYfm-r-FsQU8dU0khFEpCXsSakmxTwNFtBbDBVCpEdUZxJ_q96Grn",
        });
      }
    }

    // 3. Compute High-Level Rating Metrics
    const totalReviews = allReviewsList.length;
    let sumRating = 0;
    let fiveStarCount = 0;
    let fourStarCount = 0;
    let threeStarCount = 0;
    let twoStarCount = 0;
    let oneStarCount = 0;
    let respondedCount = 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let monthSumRating = 0;
    let monthReviewsCount = 0;

    for (const r of allReviewsList) {
      const rating = Number(r.rating || 5);
      sumRating += rating;
      if (rating === 5) fiveStarCount++;
      else if (rating === 4) fourStarCount++;
      else if (rating === 3) threeStarCount++;
      else if (rating === 2) twoStarCount++;
      else if (rating === 1) oneStarCount++;

      if (r.vendor_reply) respondedCount++;

      if (new Date(r.created_at) >= startOfMonth) {
        monthSumRating += rating;
        monthReviewsCount++;
      }
    }

    const overallRating = totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(1)) : 5.0;
    const responseRatePercent = totalReviews > 0 ? Number(((respondedCount / totalReviews) * 100).toFixed(1)) : 0;
    const avgRatingThisMonth = monthReviewsCount > 0 ? Number((monthSumRating / monthReviewsCount).toFixed(1)) : overallRating;

    const ratingDistribution = {
      fiveStarPct: totalReviews > 0 ? Number(((fiveStarCount / totalReviews) * 100).toFixed(1)) : 0,
      fourStarPct: totalReviews > 0 ? Number(((fourStarCount / totalReviews) * 100).toFixed(1)) : 0,
      threeStarPct: totalReviews > 0 ? Number(((threeStarCount / totalReviews) * 100).toFixed(1)) : 0,
      twoStarPct: totalReviews > 0 ? Number(((twoStarCount / totalReviews) * 100).toFixed(1)) : 0,
      oneStarPct: totalReviews > 0 ? Number(((oneStarCount / totalReviews) * 100).toFixed(1)) : 0,
    };

    // 4. Product-Level Performance Insights
    const productStatsMap = new Map<
      string,
      { name: string; category: string; imageUrl: string; ratings: number[] }
    >();

    for (const r of allReviewsList) {
      const ratingVal = Number(r.rating || 5);

      // Direct menu_item_id on order_reviews
      if (r.menu_items) {
        const item = r.menu_items as {
          id: string;
          name: string;
          category?: string;
          image_url?: string;
        };
        const existing = productStatsMap.get(item.id) ?? {
          name: item.name,
          category: item.category ?? "General",
          imageUrl:
            item.image_url ||
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAYyDJlcK1nzWWPU_aB5kKEETdxvuuCOxgmobxGOiNATAry3Q921sbG4Zc-RcUfIRzmbDp0HxRN1lBQCD-Nnq0K9OUiw307FYg1kadsbQIZBIkV_kboiV10jJa4WqKep6XhuawSxlM6aFcq2ozJ-VPVkobP5PC8kwWLfG8iRu4qBPa4q5SwM1ANvJbmQVUzReCOYfm-r-FsQU8dU0khFEpCXsSakmxTwNFtBbDBVCpEdUZxJ_q96Grn",
          ratings: [],
        };
        existing.ratings.push(ratingVal);
        productStatsMap.set(item.id, existing);
      }

      // Also check orders.order_items array
      if (r.orders && Array.isArray((r.orders as any).order_items)) {
        const itemsList = (r.orders as any).order_items;
        for (const oi of itemsList) {
          if (oi.item_id || oi.item_name) {
            const idKey = (oi.item_id || oi.item_name) as string;
            const meta = allCanteenMenuItemsMap.get(oi.item_id) ?? {
              name: (oi.item_name || "Dish") as string,
              category: "General",
              imageUrl:
                "https://lh3.googleusercontent.com/aida-public/AB6AXuAYyDJlcK1nzWWPU_aB5kKEETdxvuuCOxgmobxGOiNATAry3Q921sbG4Zc-RcUfIRzmbDp0HxRN1lBQCD-Nnq0K9OUiw307FYg1kadsbQIZBIkV_kboiV10jJa4WqKep6XhuawSxlM6aFcq2ozJ-VPVkobP5PC8kwWLfG8iRu4qBPa4q5SwM1ANvJbmQVUzReCOYfm-r-FsQU8dU0khFEpCXsSakmxTwNFtBbDBVCpEdUZxJ_q96Grn",
            };
            const existing = productStatsMap.get(idKey);
            if (existing) {
              existing.ratings.push(ratingVal);
              productStatsMap.set(idKey, existing);
            } else {
              productStatsMap.set(idKey, {
                name: meta.name,
                category: meta.category,
                imageUrl: meta.imageUrl,
                ratings: [ratingVal],
              });
            }
          }
        }
      }
    }

    const allProductsInsights: ProductRatingInsight[] = Array.from(productStatsMap.entries())
      .map(([mId, p]) => {
        const pTotal = p.ratings.length;
        const pSum = p.ratings.reduce((a, b) => a + b, 0);
        const pFiveCount = p.ratings.filter((r) => r === 5).length;
        return {
          menuItemId: mId,
          name: p.name,
          category: p.category,
          imageUrl: p.imageUrl,
          avgRating: pTotal > 0 ? Number((pSum / pTotal).toFixed(1)) : 5.0,
          totalReviews: pTotal,
          fiveStarPercent: pTotal > 0 ? Number(((pFiveCount / pTotal) * 100).toFixed(1)) : 0,
        };
      });

    // Highest Rated: desc by avgRating, then totalReviews desc, then name asc
    const highestRated = [...allProductsInsights]
      .sort((a, b) => {
        if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
        if (b.totalReviews !== a.totalReviews) return b.totalReviews - a.totalReviews;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 3);

    // Lowest Rated: asc by avgRating, then totalReviews desc, then name asc
    const lowestRated = [...allProductsInsights]
      .sort((a, b) => {
        if (a.avgRating !== b.avgRating) return a.avgRating - b.avgRating;
        if (b.totalReviews !== a.totalReviews) return b.totalReviews - a.totalReviews;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 3);

    // 5. Filter Reviews for API Response
    const formattedReviews: VendorReviewItem[] = allReviewsList
      .filter((r) => {
        if (ratingFilter && ratingFilter !== "all") {
          if (Number(r.rating) !== Number(ratingFilter)) return false;
        }
        if (responseStatus === "responded" && !r.vendor_reply) return false;
        if (responseStatus === "not_responded" && r.vendor_reply) return false;

        if (searchQuery) {
          const q = searchQuery.toLowerCase().trim();
          const matchText = (r.review_text ?? "").toLowerCase().includes(q);
          const matchItem = (r.menu_items?.name ?? "").toLowerCase().includes(q);
          const matchOrderNum = (r.orders?.order_number ?? "").toLowerCase().includes(q);
          
          let matchOrderItems = false;
          if (r.orders && Array.isArray((r.orders as any).order_items)) {
            matchOrderItems = (r.orders as any).order_items.some((oi: any) =>
              (oi.item_name ?? "").toLowerCase().includes(q),
            );
          }

          if (!matchText && !matchItem && !matchOrderNum && !matchOrderItems) return false;
        }

        return true;
      })
      .map((row) => ({
        id: row.id,
        orderId: row.order_id,
        orderNumber: row.orders?.order_number ?? "Order",
        canteenId: row.canteen_id,
        studentName: "Campus Student",
        menuItemId: row.menu_item_id ?? undefined,
        menuItemName: row.menu_items?.name ?? undefined,
        menuItemImageUrl: row.menu_items?.image_url ?? undefined,
        rating: Number(row.rating),
        reviewText: row.review_text ?? "",
        vendorReply: row.vendor_reply ?? undefined,
        vendorRepliedAtIso: row.vendor_replied_at ?? undefined,
        reportStatus: row.report_status as VendorReviewItem["reportStatus"],
        reportReason: row.report_reason ?? undefined,
        createdAtIso: row.created_at,
      }));

    const data: VendorReviewsData = {
      metrics: {
        overallRating,
        totalReviews,
        fiveStarCount,
        fourStarCount,
        threeStarCount,
        twoStarCount,
        oneStarCount,
        responseRatePercent,
        avgRatingThisMonth,
      },
      ratingDistribution,
      ratingTrend: [],
      productInsights: {
        highestRated,
        lowestRated,
        allProducts: allProductsInsights,
      },
      feedbackInsights: {
        positiveKeywords: ["Delicious", "Fresh", "Fast Delivery", "Hot", "Great Portion"],
        negativeKeywords: ["Less Spicy", "Late Pickup", "Cold"],
        topPraisedDishes: highestRated.map((h) => h.name),
      },
      reviews: formattedReviews,
    };

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("Vendor reviews GET error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 },
    );
  }
}
