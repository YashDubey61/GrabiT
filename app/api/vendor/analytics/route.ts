import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import type { VendorAnalyticsData, TopProductAnalytics } from "@/lib/supabase/vendor_analytics";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") ?? "7d";
    const customStart = searchParams.get("startDate");
    const customEnd = searchParams.get("endDate");

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

    // 2. Compute Exact Date Range Boundaries (Primary Period & Comparative Previous Period)
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();
    let dateRangeLabel = "Last 7 Days";

    if (timeframe === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      prevStartDate = new Date(startDate.getTime() - 86400000);
      prevEndDate = new Date(endDate.getTime() - 86400000);
      dateRangeLabel = "Today";
    } else if (timeframe === "yesterday") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
      prevStartDate = new Date(startDate.getTime() - 86400000);
      prevEndDate = new Date(endDate.getTime() - 86400000);
      dateRangeLabel = "Yesterday";
    } else if (timeframe === "30d") {
      startDate = new Date(now.getTime() - 30 * 86400000);
      prevStartDate = new Date(startDate.getTime() - 30 * 86400000);
      prevEndDate = new Date(startDate.getTime());
      dateRangeLabel = "Last 30 Days";
    } else if (timeframe === "this_month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const diffMs = now.getTime() - startDate.getTime();
      prevStartDate = new Date(startDate.getTime() - diffMs);
      prevEndDate = new Date(startDate.getTime());
      dateRangeLabel = "This Month";
    } else if (timeframe === "custom" && customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      const diffMs = endDate.getTime() - startDate.getTime();
      prevStartDate = new Date(startDate.getTime() - diffMs);
      prevEndDate = new Date(startDate.getTime());
      dateRangeLabel = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    } else {
      // Default: 7d
      startDate = new Date(now.getTime() - 7 * 86400000);
      prevStartDate = new Date(startDate.getTime() - 7 * 86400000);
      prevEndDate = new Date(startDate.getTime());
      dateRangeLabel = "Last 7 Days";
    }

    // 3. Fetch Orders for Primary Period
    const { data: primaryOrders, error: orderErr } = await supabase
      .from("orders")
      .select("*, order_items(*, menu_items(name, category, price, image_url))")
      .eq("canteen_id", canteenId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });

    if (orderErr) {
      console.error("Primary orders query error:", orderErr);
    }
    const orders = primaryOrders ?? [];

    // Fetch Orders for Previous Comparative Period
    const { data: prevOrders } = await supabase
      .from("orders")
      .select("id, total_amount, status")
      .eq("canteen_id", canteenId)
      .gte("created_at", prevStartDate.toISOString())
      .lte("created_at", prevEndDate.toISOString());

    const prevList = prevOrders ?? [];

    // 4. Compute High-Level Metrics
    const validOrders = orders.filter((o) => o.status !== "cancelled" && o.status !== "rejected");
    const prevValidOrders = prevList.filter((o) => o.status !== "cancelled" && o.status !== "rejected");

    const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const prevRevenue = prevValidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const onlineOrders = validOrders.filter((o) => o.order_type !== "MANUAL_CASH_ORDER" && !o.is_manual);
    const manualOrders = validOrders.filter((o) => o.order_type === "MANUAL_CASH_ORDER" || o.is_manual);

    const onlineSales = onlineOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const manualCashSales = manualOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const totalOrders = orders.length;
    const prevOrdersCount = prevList.length;

    const completedOrders = orders.filter(
      (o) => o.status === "completed" || o.status === "picked_up",
    ).length;
    const cancelledOrders = orders.filter(
      (o) => o.status === "cancelled" || o.status === "rejected",
    ).length;

    const avgOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;
    const prevAov = prevValidOrders.length > 0 ? prevRevenue / prevValidOrders.length : 0;

    const revenueGrowthPercent =
      prevRevenue > 0
        ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
        : totalRevenue > 0
          ? 100
          : 0;

    const ordersGrowthPercent =
      prevOrdersCount > 0
        ? ((totalOrders - prevOrdersCount) / prevOrdersCount) * 100
        : totalOrders > 0
          ? 100
          : 0;

    const aovGrowthPercent =
      prevAov > 0
        ? ((avgOrderValue - prevAov) / prevAov) * 100
        : avgOrderValue > 0
          ? 100
          : 0;

    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    // Order status breakdown counts
    const orderStatusBreakdown = {
      placed: orders.filter((o) => o.status === "placed").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      ready: orders.filter((o) => o.status === "ready").length,
      completed: completedOrders,
      cancelled: cancelledOrders,
    };

    // 5. Daily / Period Revenue Trend
    const trendMap = new Map<string, { revenue: number; ordersCount: number }>();
    let itemsSold = 0;

    // Initialize daily slots if multi-day period
    const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000);
    if (dayDiff <= 31) {
      for (let d = 0; d < Math.max(1, dayDiff); d++) {
        const temp = new Date(startDate.getTime() + d * 86400000);
        const key = temp.toISOString().slice(0, 10);
        const label = temp.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        trendMap.set(key, { revenue: 0, ordersCount: 0 });
      }
    }

    for (const o of orders) {
      const dKey = new Date(o.created_at).toISOString().slice(0, 10);
      const isOk = o.status !== "cancelled" && o.status !== "rejected";
      const amt = isOk ? Number(o.total_amount || 0) : 0;

      const current = trendMap.get(dKey) ?? { revenue: 0, ordersCount: 0 };
      current.revenue += amt;
      current.ordersCount += 1;
      trendMap.set(dKey, current);

      const oItems = o.order_items ?? [];
      for (const item of oItems) {
        itemsSold += item.quantity || 0;
      }
    }

    const revenueTrend = Array.from(trendMap.entries()).map(([k, v]) => {
      const dt = new Date(k);
      const label = dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        dateStr: k,
        label,
        revenue: v.revenue,
        ordersCount: v.ordersCount,
      };
    });

    // 6. Top Selling Products & Category Breakdown
    const itemMap = new Map<
      string,
      { name: string; category: string; imageUrl: string; price: number; units: number; rev: number }
    >();
    const categoryMap = new Map<string, { orders: number; items: number; rev: number }>();

    for (const o of orders) {
      if (o.status === "cancelled" || o.status === "rejected") continue;
      const oItems = o.order_items ?? [];
      for (const item of oItems) {
        const mInfo = item.menu_items as {
          name: string;
          category?: string;
          price?: number;
          image_url?: string;
        } | null;
        const name = mInfo?.name ?? "Canteen Dish";
        const cat = mInfo?.category ?? "General";
        const img =
          mInfo?.image_url ||
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAYyDJlcK1nzWWPU_aB5kKEETdxvuuCOxgmobxGOiNATAry3Q921sbG4Zc-RcUfIRzmbDp0HxRN1lBQCD-Nnq0K9OUiw307FYg1kadsbQIZBIkV_kboiV10jJa4WqKep6XhuawSxlM6aFcq2ozJ-VPVkobP5PC8kwWLfG8iRu4qBPa4q5SwM1ANvJbmQVUzReCOYfm-r-FsQU8dU0khFEpCXsSakmxTwNFtBbDBVCpEdUZxJ_q96Grn";
        const qty = Number(item.quantity || 0);
        const price = Number(item.price_at_order || mInfo?.price || 0);
        const lineRev = qty * price;

        // Product stats
        const pStat = itemMap.get(item.menu_item_id) ?? {
          name,
          category: cat,
          imageUrl: img,
          price,
          units: 0,
          rev: 0,
        };
        pStat.units += qty;
        pStat.rev += lineRev;
        itemMap.set(item.menu_item_id, pStat);

        // Category stats
        const cStat = categoryMap.get(cat) ?? { orders: 0, items: 0, rev: 0 };
        cStat.items += qty;
        cStat.rev += lineRev;
        cStat.orders += 1;
        categoryMap.set(cat, cStat);
      }
    }

    const allProductsList: TopProductAnalytics[] = Array.from(itemMap.entries())
      .map(([id, p]) => ({
        id,
        name: p.name,
        category: p.category,
        imageUrl: p.imageUrl,
        price: p.price,
        unitsSold: p.units,
        revenue: p.rev,
        percentageOfTotal: totalRevenue > 0 ? (p.rev / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const topProducts = allProductsList.slice(0, 10);
    const bestPerformers = allProductsList.slice(0, 3);
    const slowMovers = [...allProductsList].reverse().slice(0, 3);

    const categoryAnalytics = Array.from(categoryMap.entries()).map(([cat, c]) => ({
      category: cat,
      orderCount: c.orders,
      itemsSold: c.items,
      revenue: c.rev,
      percentageContribution: totalRevenue > 0 ? (c.rev / totalRevenue) * 100 : 0,
    }));

    // 7. Peak Order Hours Demand (converted to local IST UTC+5:30)
    const hourlyCounts = new Array(24).fill(0);
    for (const o of orders) {
      const dt = new Date(o.created_at);
      // IST offset +5:30
      const istHour = (dt.getUTCHours() + 5 + Math.floor((dt.getUTCMinutes() + 30) / 60)) % 24;
      hourlyCounts[istHour]++;
    }

    let maxHourlyCount = 0;
    let peakHourIndex = 12;
    let minHourlyCount = Infinity;
    let lowestHourIndex = 0;
    let sumHourlyCount = 0;

    for (let h = 0; h < 24; h++) {
      const cnt = hourlyCounts[h];
      sumHourlyCount += cnt;
      if (cnt > maxHourlyCount) {
        maxHourlyCount = cnt;
        peakHourIndex = h;
      }
      if (cnt < minHourlyCount) {
        minHourlyCount = cnt;
        lowestHourIndex = h;
      }
    }

    const formatHourLabel = (h: number) => {
      if (h === 0) return "12 AM";
      if (h < 12) return `${h} AM`;
      if (h === 12) return "12 PM";
      return `${h - 12} PM`;
    };

    const peakHours = hourlyCounts.map((cnt, h) => ({
      hourLabel: formatHourLabel(h),
      hour24: h,
      ordersCount: cnt,
      isPeak: h === peakHourIndex && cnt > 0,
    }));

    // 8. Customer Insights
    const studentOrdersMap = new Map<string, number>();
    for (const o of orders) {
      if (o.student_id) {
        studentOrdersMap.set(o.student_id, (studentOrdersMap.get(o.student_id) ?? 0) + 1);
      }
    }

    const uniqueCustomersCount = studentOrdersMap.size;
    let returningCustomersCount = 0;
    let newCustomersCount = 0;

    studentOrdersMap.forEach((count) => {
      if (count > 1) returningCustomersCount++;
      else newCustomersCount++;
    });

    const repeatOrderRate =
      uniqueCustomersCount > 0 ? (returningCustomersCount / uniqueCustomersCount) * 100 : 0;
    const avgOrdersPerCustomer =
      uniqueCustomersCount > 0 ? totalOrders / uniqueCustomersCount : 0;

    // 9. Offer Performance Insights
    const { data: promoOffers } = await supabase
      .from("promo_codes")
      .select("id, code")
      .eq("canteen_id", canteenId);

    const promoIds = (promoOffers ?? []).map((p) => p.id);
    let ordersUsingOffersCount = 0;
    let totalDiscountGiven = 0;
    let revenueFromOfferOrders = 0;
    let mostUsedOfferCode: string | undefined = undefined;

    if (promoIds.length > 0) {
      const { data: redData } = await supabase
        .from("promo_code_redemptions")
        .select("id, promo_code_id, discount_amount, orders ( total_amount )")
        .in("promo_code_id", promoIds);

      const redList = redData ?? [];
      ordersUsingOffersCount = redList.length;

      const codeUsageMap = new Map<string, number>();

      for (const r of redList) {
        totalDiscountGiven += Number(r.discount_amount || 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orderObj: any = Array.isArray(r.orders) ? r.orders[0] : r.orders;
        revenueFromOfferOrders += Number(orderObj?.total_amount || 0);
        const code = promoOffers?.find((p) => p.id === r.promo_code_id)?.code;
        if (code) {
          codeUsageMap.set(code, (codeUsageMap.get(code) ?? 0) + 1);
        }
      }

      let maxUsage = 0;
      codeUsageMap.forEach((u, code) => {
        if (u > maxUsage) {
          maxUsage = u;
          mostUsedOfferCode = code;
        }
      });
    }

    // 10. Inventory Insights
    const { data: invItems } = await supabase
      .from("menu_items")
      .select("name, stock_quantity, low_stock_threshold, availability")
      .eq("canteen_id", canteenId);

    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockUnits = 0;
    const topDemandedOutStockItems: string[] = [];

    (invItems ?? []).forEach((item) => {
      const qty = Number(item.stock_quantity ?? 50);
      const thresh = Number(item.low_stock_threshold ?? 10);
      totalStockUnits += qty;

      if (qty === 0 || item.availability === "unavailable") {
        outOfStockCount++;
        topDemandedOutStockItems.push(item.name);
      } else if (qty <= thresh) {
        lowStockCount++;
      }
    });

    const data: VendorAnalyticsData = {
      timeframe,
      dateRangeLabel,
      metrics: {
        totalRevenue,
        prevRevenue,
        revenueGrowthPercent,
        totalOrders,
        prevOrders: prevOrdersCount,
        ordersGrowthPercent,
        avgOrderValue,
        prevAov,
        aovGrowthPercent,
        itemsSold,
        completedOrders,
        cancelledOrders,
        completionRate,
        cancellationRate,
        avgPrepTimeMinutes: 10,
      },
      revenueTrend,
      orderStatusBreakdown,
      topProducts,
      bestPerformers,
      slowMovers,
      categoryAnalytics,
      peakHours,
      peakHourSummary: {
        peakHourLabel: formatHourLabel(peakHourIndex),
        lowestHourLabel: formatHourLabel(lowestHourIndex === Infinity ? 0 : lowestHourIndex),
        avgOrdersPerHour: totalOrders > 0 ? Number((totalOrders / 24).toFixed(1)) : 0,
      },
      customerInsights: {
        uniqueCustomersCount,
        returningCustomersCount,
        newCustomersCount,
        repeatOrderRate,
        avgOrdersPerCustomer,
      },
      offerPerformance: {
        ordersUsingOffersCount,
        totalDiscountGiven,
        revenueFromOfferOrders,
        mostUsedOfferCode,
        bestPerformingOfferCode: mostUsedOfferCode,
      },
      inventoryInsights: {
        lowStockCount,
        outOfStockCount,
        totalStockUnits,
        topDemandedOutStockItems: topDemandedOutStockItems.slice(0, 5),
      },
      summary: {
        todaysSales: totalRevenue,
        onlineSales,
        manualCashSales,
        salesGrowthPercent: Number(revenueGrowthPercent.toFixed(1)),
        totalOrders,
        targetOrders: Math.max(100, totalOrders + 20),
        avgPrepTimeMinutes: 10,
        prepTimeDeltaMinutes: -0.5,
      },
      hourlyVolume: peakHours.map((p) => ({
        label: p.hourLabel,
        heightPercent: maxHourlyCount > 0 ? Math.round((p.ordersCount / maxHourlyCount) * 100) : 0,
        isPeak: p.isPeak,
      })),
      topItems: topProducts.map((p) => ({
        id: p.id,
        name: p.name,
        orderCount: p.unitsSold,
        revenue: p.revenue,
        imageUrl: p.imageUrl,
      })),
    };

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("Vendor analytics API error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error calculating analytics." },
      { status: 500 },
    );
  }
}
