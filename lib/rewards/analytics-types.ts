export interface RewardsKpis {
  ordersCount: number;
  pointsIssued: number;
  pointsRedeemed: number;
  pointsTransferred: number;
  pointsReceived: number;
  giftBonusPoints: number;
  outstandingPoints: number;
  rewardCostGrabit: number;
  rewardCostVendor: number;
  avgContributionProfitPerOrder: number;
  repeatOrdersWithReward: number;
  repeatOrdersWithoutReward: number;
  attributionWindowDays: number;
  usersEarned: number;
  usersViewed: number;
  usersRedeemed: number;
  repeatPurchasers: number;
  incrementalContribution: number;
  estimatedRoiPercent: number | null;
}

export interface RewardCostBreakdownRow {
  reward_id: string;
  reward_name: string;
  funding_type: "GRABIT" | "VENDOR" | "SPONSORED" | "SHARED";
  redemptions: number;
  points_used: number;
  customer_value: number;
  grabit_cost: number;
  vendor_cost: number;
}

export interface VendorRewardsPerformanceRow {
  canteen_id: string;
  canteen_name: string;
  orders: number;
  points_issued: number;
  redemptions: number;
  grabit_cost: number;
  vendor_cost: number;
  repeat_orders: number;
}

export interface RewardsTimeseriesPoint {
  day: string;
  points_issued: number;
  points_redeemed: number;
  reward_cost: number;
  redemptions: number;
  reward_driven_orders: number;
}

export interface GiftingAnalytics {
  pointsSent: number;
  senders: number;
  recipients: number;
  foodGifts: number;
  rewardGifts: number;
  giftBonusPoints: number;
  recipientsWhoOrdered: number;
  attributionWindowDays: number;
}

export interface PointsLiabilityBreakdown {
  outstandingPoints: number;
  giftedUnredeemedEstimate: number;
  aging: {
    days0to7: number;
    days8to30: number;
    days31to90: number;
    days90plus: number;
  };
}

export interface LeaderboardEconomics {
  top10Points: number;
  top10AvgOrders: number;
  top10RepeatRate: number;
  top10RewardCost: number;
  restAvgOrders: number;
}

export interface RedemptionLifecycleStats {
  generated: number;
  used: number;
  expired: number;
  cancelled: number;
  settled: number;
  settlementPending: number;
  settledAmount: number;
}

export interface RewardsAnalyticsResponse {
  lifecycle: RedemptionLifecycleStats;
  kpis: RewardsKpis;
  costBreakdown: RewardCostBreakdownRow[];
  vendorPerformance: VendorRewardsPerformanceRow[];
  timeseries: RewardsTimeseriesPoint[];
  gifting: GiftingAnalytics;
  liability: PointsLiabilityBreakdown;
  leaderboardEconomics: LeaderboardEconomics;
  marginThresholds: { watch: number; high: number; critical: number };
  rangeStart: string;
  rangeEnd: string;
  canteens: { id: string; name: string }[];
}

export type RewardsAnalyticsRange = "today" | "7d" | "30d" | "90d" | "month" | "year";
