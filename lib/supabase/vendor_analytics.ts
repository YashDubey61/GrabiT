import type {
  VendorAnalyticsSummary,
  VendorHourlyPoint,
  VendorTopItemMetric,
  VendorPayoutRecord,
} from "@/lib/mock/vendor";

export interface LiveVendorAnalyticsData {
  summary: VendorAnalyticsSummary;
  hourlyVolume: VendorHourlyPoint[];
  topItems: VendorTopItemMetric[];
  payouts: VendorPayoutRecord[];
}

/**
 * Fetch live vendor analytics & payouts summary from Supabase database via server API.
 */
export async function getLiveVendorAnalytics(
  timeframe: "today" | "7d" | "30d" = "today",
): Promise<LiveVendorAnalyticsData | null> {
  try {
    const res = await fetch(`/api/vendor/analytics?timeframe=${timeframe}`);
    const data = await res.json();

    if (!res.ok || !data.ok) {
      return null;
    }

    return {
      summary: data.summary,
      hourlyVolume: data.hourlyVolume,
      topItems: data.topItems,
      payouts: data.payouts,
    };
  } catch {
    return null;
  }
}
