export type PointTransactionType = "EARN" | "REDEEM" | "SEND" | "RECEIVE" | "GIFT_BONUS" | "ADJUST";
export type RewardType = "FOOD_ITEM" | "DISCOUNT" | "PERK";
export type LeaderboardPeriod = "weekly" | "monthly" | "alltime";

export interface RewardAccountSummary {
  pointsBalance: number;
  lifetimeEarned: number;
  earnedThisWeek: number;
  earnedThisMonth: number;
  rank: number | null;
  nextRewardName: string | null;
  nextRewardPointsCost: number | null;
  progressToNextReward: number; // 0-1
}

export interface PointTransactionItem {
  id: string;
  type: PointTransactionType;
  amount: number;
  description: string;
  createdAt: string;
  relatedOrderNumber?: string | null;
  relatedUserName?: string | null;
}

export interface RewardCatalogItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  pointsCost: number;
  rewardType: RewardType;
  isGiftable: boolean;
  canteenName: string | null;
  stockRemaining: number | null;
  available: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  /** GRABIT ID (e.g. "GRB12345") — the only identifier shown on the
   * public Campus Leaders board, never the student's real name. */
  grabitUserId: string | null;
  avatarUrl: string;
  points: number;
  rank: number;
  isCurrentUser: boolean;
}

export interface FriendActivityItem {
  id: string;
  kind: "SENT" | "RECEIVED" | "GIFT_SENT" | "GIFT_RECEIVED";
  counterpartName: string;
  amount: number | null;
  rewardName: string | null;
  createdAt: string;
}

export interface FriendSearchResult {
  userId: string;
  displayName: string;
  grabitUserId: string | null;
}
