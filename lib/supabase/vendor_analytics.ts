export interface RevenueTrendPoint {
  dateStr: string; // "2026-08-20" or "10:00"
  label: string; // "Aug 20" or "10 AM"
  revenue: number;
  ordersCount: number;
}

export interface PeakHourPoint {
  hourLabel: string; // "12 PM"
  hour24: number; // 12
  ordersCount: number;
  isPeak: boolean;
}

export interface TopProductAnalytics {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  price: number;
  unitsSold: number;
  revenue: number;
  percentageOfTotal: number;
}

export interface CategoryAnalyticsItem {
  category: string;
  orderCount: number;
  itemsSold: number;
  revenue: number;
  percentageContribution: number;
}

export interface VendorAnalyticsData {
  timeframe: string;
  dateRangeLabel: string;
  metrics: {
    totalRevenue: number;
    prevRevenue: number;
    revenueGrowthPercent: number;
    totalOrders: number;
    prevOrders: number;
    ordersGrowthPercent: number;
    avgOrderValue: number;
    prevAov: number;
    aovGrowthPercent: number;
    itemsSold: number;
    completedOrders: number;
    cancelledOrders: number;
    completionRate: number;
    cancellationRate: number;
    avgPrepTimeMinutes?: number;
  };
  revenueTrend: RevenueTrendPoint[];
  orderStatusBreakdown: {
    placed: number;
    preparing: number;
    ready: number;
    completed: number;
    cancelled: number;
  };
  topProducts: TopProductAnalytics[];
  bestPerformers: TopProductAnalytics[];
  slowMovers: TopProductAnalytics[];
  categoryAnalytics: CategoryAnalyticsItem[];
  peakHours: PeakHourPoint[];
  peakHourSummary: {
    peakHourLabel: string;
    lowestHourLabel: string;
    avgOrdersPerHour: number;
  };
  customerInsights: {
    uniqueCustomersCount: number;
    returningCustomersCount: number;
    newCustomersCount: number;
    repeatOrderRate: number;
    avgOrdersPerCustomer: number;
  };
  offerPerformance: {
    ordersUsingOffersCount: number;
    totalDiscountGiven: number;
    revenueFromOfferOrders: number;
    mostUsedOfferCode?: string;
    bestPerformingOfferCode?: string;
  };
  inventoryInsights: {
    lowStockCount: number;
    outOfStockCount: number;
    totalStockUnits: number;
    topDemandedOutStockItems: string[];
  };
  summary: {
    todaysSales: number;
    onlineSales?: number;
    manualCashSales?: number;
    salesGrowthPercent: number;
    totalOrders: number;
    targetOrders: number;
    avgPrepTimeMinutes: number;
    prepTimeDeltaMinutes: number;
  };
  hourlyVolume: Array<{
    label: string;
    heightPercent: number;
    isPeak?: boolean;
  }>;
  topItems: Array<{
    id: string;
    name: string;
    orderCount: number;
    revenue: number;
    imageUrl: string;
  }>;
}

export type LiveVendorAnalyticsData = VendorAnalyticsData;

export async function getLiveVendorAnalytics(
  timeframe = "7d",
  startDate?: string,
  endDate?: string,
): Promise<{ ok: boolean; data?: VendorAnalyticsData; error?: string }> {
  try {
    const params = new URLSearchParams({ timeframe });
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    const res = await fetch(`/api/vendor/analytics?${params.toString()}`, {
      headers: { "Cache-Control": "no-cache" },
    });
    const result = await res.json();
    if (!res.ok || !result.ok) {
      return { ok: false, error: result.error ?? "Failed to fetch analytics." };
    }
    return { ok: true, data: result.data };
  } catch (err) {
    console.error("Fetch vendor analytics error:", err);
    return { ok: false, error: "Network error loading vendor analytics." };
  }
}

/**
 * Generate and download CSV file containing aggregated vendor analytics report.
 */
export function exportVendorAnalyticsCsv(data: VendorAnalyticsData) {
  const lines: string[] = [];

  lines.push(`GRABIT Vendor Analytics Report - ${data.dateRangeLabel}`);
  lines.push(`Generated At,${new Date().toLocaleString()}`);
  lines.push("");

  lines.push("--- SUMMARY METRICS ---");
  lines.push(`Total Revenue,₹${data.metrics.totalRevenue.toFixed(2)}`);
  lines.push(`Total Orders,${data.metrics.totalOrders}`);
  lines.push(`Average Order Value,₹${data.metrics.avgOrderValue.toFixed(2)}`);
  lines.push(`Items Sold,${data.metrics.itemsSold}`);
  lines.push(`Completion Rate,${data.metrics.completionRate.toFixed(1)}%`);
  lines.push(`Cancellation Rate,${data.metrics.cancellationRate.toFixed(1)}%`);
  lines.push("");

  lines.push("--- DAILY REVENUE & ORDERS ---");
  lines.push("Date,Revenue (₹),Orders Count");
  data.revenueTrend.forEach((pt) => {
    lines.push(`"${pt.label}",${pt.revenue.toFixed(2)},${pt.ordersCount}`);
  });
  lines.push("");

  lines.push("--- TOP SELLING PRODUCTS ---");
  lines.push("Product Name,Category,Units Sold,Revenue (₹),% Share");
  data.topProducts.forEach((p) => {
    lines.push(
      `"${p.name}","${p.category}",${p.unitsSold},${p.revenue.toFixed(2)},${p.percentageOfTotal.toFixed(1)}%`,
    );
  });
  lines.push("");

  lines.push("--- CATEGORY PERFORMANCE ---");
  lines.push("Category,Orders Count,Items Sold,Revenue (₹),% Share");
  data.categoryAnalytics.forEach((c) => {
    lines.push(
      `"${c.category}",${c.orderCount},${c.itemsSold},${c.revenue.toFixed(2)},${c.percentageContribution.toFixed(1)}%`,
    );
  });

  const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(lines.join("\n"));
  const link = document.createElement("a");
  link.setAttribute("href", csvContent);
  link.setAttribute(
    "download",
    `GRABIT_Analytics_${data.timeframe}_${new Date().toISOString().slice(0, 10)}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
