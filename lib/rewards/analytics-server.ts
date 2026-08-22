import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import type {
  RewardsAnalyticsResponse,
  RewardsAnalyticsRange,
  RewardsKpis,
  RewardCostBreakdownRow,
  VendorRewardsPerformanceRow,
  RewardsTimeseriesPoint,
  GiftingAnalytics,
  PointsLiabilityBreakdown,
  LeaderboardEconomics,
} from "@/lib/rewards/analytics-types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export function resolveRange(range: RewardsAnalyticsRange): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "7d":
      start.setDate(end.getDate() - 7);
      break;
    case "30d":
      start.setDate(end.getDate() - 30);
      break;
    case "90d":
      start.setDate(end.getDate() - 90);
      break;
    case "month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
  }
  return { start, end };
}

/** Fail-closed: only a Super Admin session can reach the analytics RPCs
 * (the RPCs themselves also enforce role via auth.uid(), this is belt
 * and braces at the API layer so we never even attempt the call). */
export async function getAuthenticatedAdminOrNull() {
  return getAuthenticatedSuperAdminContext();
}

export async function getRewardsAnalytics(
  range: RewardsAnalyticsRange,
  canteenId: string | null,
): Promise<RewardsAnalyticsResponse> {
  const { start, end } = resolveRange(range);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const admin = getSupabaseAdminClient();

  const [
    kpisRes,
    costBreakdownRes,
    vendorPerfRes,
    timeseriesRes,
    giftingRes,
    liabilityRes,
    leaderboardRes,
    configRes,
    canteensRes,
    lifecycleRes,
  ] = await Promise.all([
    admin.rpc("get_rewards_kpis", { p_start: startIso, p_end: endIso, p_canteen_id: canteenId }),
    admin.rpc("get_reward_cost_breakdown", { p_start: startIso, p_end: endIso, p_canteen_id: canteenId }),
    admin.rpc("get_vendor_rewards_performance", { p_start: startIso, p_end: endIso }),
    admin.rpc("get_rewards_timeseries", { p_start: startIso, p_end: endIso, p_canteen_id: canteenId }),
    admin.rpc("get_gifting_analytics", { p_start: startIso, p_end: endIso }),
    admin.rpc("get_points_liability_breakdown"),
    admin.rpc("get_leaderboard_economics", { p_start: startIso, p_end: endIso }),
    admin.from("platform_settings").select("value").eq("key", "rewards_analytics_config").maybeSingle(),
    admin.from("canteens").select("id, name").order("name", { ascending: true }),
    admin.rpc("get_redemption_lifecycle_stats", { p_start: startIso, p_end: endIso, p_canteen_id: canteenId }),
  ]);

  for (const res of [kpisRes, costBreakdownRes, vendorPerfRes, timeseriesRes, giftingRes, liabilityRes, leaderboardRes, lifecycleRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  const config = configRes.data?.value as { marginThresholds?: { watch: number; high: number; critical: number } } | undefined;

  return {
    kpis: kpisRes.data as RewardsKpis,
    costBreakdown: (costBreakdownRes.data ?? []) as RewardCostBreakdownRow[],
    vendorPerformance: (vendorPerfRes.data ?? []) as VendorRewardsPerformanceRow[],
    timeseries: (timeseriesRes.data ?? []) as RewardsTimeseriesPoint[],
    gifting: giftingRes.data as GiftingAnalytics,
    liability: liabilityRes.data as PointsLiabilityBreakdown,
    leaderboardEconomics: leaderboardRes.data as LeaderboardEconomics,
    marginThresholds: config?.marginThresholds ?? { watch: 20, high: 30, critical: 50 },
    rangeStart: startIso,
    rangeEnd: endIso,
    canteens: canteensRes.data ?? [],
    lifecycle: lifecycleRes.data,
  };
}
