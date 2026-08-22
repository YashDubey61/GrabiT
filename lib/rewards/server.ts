import { createClient as createServerClient } from "@/lib/supabase/server";
import { resolveImageUrl } from "@/lib/utils/image";
import type {
  RewardAccountSummary,
  PointTransactionItem,
  RewardCatalogItem,
  LeaderboardEntry,
  LeaderboardPeriod,
  FriendActivityItem,
  FriendSearchResult,
} from "@/lib/rewards/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
export { getSupabaseAdminClient };

export interface RewardsStudentContext {
  userId: string;
  campusId: string | null;
  displayName: string;
}

/** Server-side student identity resolver for the Rewards feature —
 * same fail-closed pattern as getAuthenticatedVendorContext /
 * getAuthenticatedSuperAdminContext elsewhere in this codebase. */
export async function getAuthenticatedStudentContext(): Promise<RewardsStudentContext | null> {
  try {
    const supabaseServer = await createServerClient();
    const {
      data: { user },
    } = await supabaseServer.auth.getUser();
    if (!user) return null;

    const admin = getSupabaseAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("role, campus_id, full_name, grabit_user_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "student") return null;

    return {
      userId: user.id,
      campusId: profile.campus_id ?? null,
      displayName: profile.full_name || profile.grabit_user_id || "Campus Student",
    };
  } catch {
    return null;
  }
}

export async function displayNameForUser(userId: string): Promise<string> {
  const admin = getSupabaseAdminClient();
  const { data } = await admin.from("users").select("full_name, grabit_user_id").eq("id", userId).maybeSingle();
  return data?.full_name || data?.grabit_user_id || "Campus Student";
}

export async function getRewardSummary(ctx: RewardsStudentContext): Promise<RewardAccountSummary> {
  const admin = getSupabaseAdminClient();

  const { data: account } = await admin
    .from("reward_accounts")
    .select("points_balance, lifetime_earned")
    .eq("user_id", ctx.userId)
    .maybeSingle();

  const pointsBalance = account?.points_balance ?? 0;
  const lifetimeEarned = account?.lifetime_earned ?? 0;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [{ data: weekTx }, { data: monthTx }] = await Promise.all([
    admin
      .from("point_transactions")
      .select("amount")
      .eq("user_id", ctx.userId)
      .eq("type", "EARN")
      .gte("created_at", weekStart.toISOString()),
    admin
      .from("point_transactions")
      .select("amount")
      .eq("user_id", ctx.userId)
      .eq("type", "EARN")
      .gte("created_at", monthStart.toISOString()),
  ]);

  const earnedThisWeek = (weekTx ?? []).reduce((s, t) => s + t.amount, 0);
  const earnedThisMonth = (monthTx ?? []).reduce((s, t) => s + t.amount, 0);

  // Campus rank by lifetime earned (leaderboard-eligible score, see
  // getLeaderboard — same definition used here for consistency).
  let rank: number | null = null;
  if (ctx.campusId) {
    const { data: campusAccounts } = await admin
      .from("reward_accounts")
      .select("user_id, lifetime_earned, users!inner(campus_id)")
      .eq("users.campus_id", ctx.campusId)
      .order("lifetime_earned", { ascending: false });

    if (campusAccounts) {
      const idx = campusAccounts.findIndex((a) => a.user_id === ctx.userId);
      rank = idx >= 0 ? idx + 1 : campusAccounts.length + 1;
    }
  }

  // Cheapest reward the student hasn't unlocked yet — used for the
  // "progress toward next reward" bar.
  const { data: nextReward } = await admin
    .from("rewards")
    .select("name, points_cost")
    .eq("is_active", true)
    .gt("points_cost", pointsBalance)
    .order("points_cost", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: cheapestReward } = await admin
    .from("rewards")
    .select("points_cost")
    .eq("is_active", true)
    .order("points_cost", { ascending: true })
    .limit(1)
    .maybeSingle();

  const progressBase = cheapestReward?.points_cost || 1;

  return {
    pointsBalance,
    lifetimeEarned,
    earnedThisWeek,
    earnedThisMonth,
    rank,
    nextRewardName: nextReward?.name ?? null,
    nextRewardPointsCost: nextReward?.points_cost ?? null,
    progressToNextReward: nextReward
      ? Math.min(1, pointsBalance / nextReward.points_cost)
      : Math.min(1, pointsBalance / progressBase),
  };
}

export async function getPointHistory(userId: string, limit = 30): Promise<PointTransactionItem[]> {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("point_transactions")
    .select("id, type, amount, description, created_at, related_order_id, related_user_id, orders(order_number), related_user:related_user_id(full_name, grabit_user_id)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id,
    type: row.type,
    amount: row.amount,
    description: row.description,
    createdAt: row.created_at,
    relatedOrderNumber: row.orders?.order_number ?? null,
    relatedUserName: row.related_user?.full_name || row.related_user?.grabit_user_id || null,
  }));
}

export async function getRewardCatalog(): Promise<RewardCatalogItem[]> {
  const admin = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const { data } = await admin
    .from("rewards")
    .select("id, name, description, image_url, points_cost, reward_type, is_giftable, stock_remaining, starts_at, ends_at, canteens(name)")
    .eq("is_active", true)
    .order("points_cost", { ascending: true });

  if (!data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[])
    .filter((r) => (!r.starts_at || r.starts_at <= nowIso) && (!r.ends_at || r.ends_at >= nowIso))
    .map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      imageUrl: r.image_url,
      pointsCost: r.points_cost,
      rewardType: r.reward_type,
      isGiftable: r.is_giftable,
      canteenName: r.canteens?.name ?? null,
      stockRemaining: r.stock_remaining,
      available: r.stock_remaining === null || r.stock_remaining > 0,
    }));
}

export async function getLeaderboard(
  period: LeaderboardPeriod,
  campusId: string | null,
  currentUserId: string,
): Promise<{ entries: LeaderboardEntry[]; currentUserRank: number | null }> {
  const admin = getSupabaseAdminClient();

  let since: string | null = null;
  const now = new Date();
  if (period === "weekly") {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    since = weekStart.toISOString();
  } else if (period === "monthly") {
    since = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }

  // Leaderboard score = sum of EARN transactions only (valid completed
  // orders) — SEND/RECEIVE/GIFT_BONUS never move the ranking, so
  // students can't climb by shuffling points between each other.
  let query = admin
    .from("point_transactions")
    .select(
      "user_id, amount, users!point_transactions_user_id_fkey!inner(full_name, grabit_user_id, avatar_url, campus_id)",
    )
    .eq("type", "EARN");

  if (since) query = query.gte("created_at", since);
  if (campusId) query = query.eq("users.campus_id", campusId);

  const { data } = await query;
  if (!data) return { entries: [], currentUserRank: null };

  const totals = new Map<
    string,
    { points: number; name: string; grabitUserId: string | null; avatarUrl: string | null }
  >();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of data as any[]) {
    const existing = totals.get(row.user_id);
    const name = row.users?.full_name || row.users?.grabit_user_id || "Campus Student";
    if (existing) {
      existing.points += row.amount;
    } else {
      totals.set(row.user_id, {
        points: row.amount,
        name,
        grabitUserId: row.users?.grabit_user_id ?? null,
        avatarUrl: row.users?.avatar_url ?? null,
      });
    }
  }

  const ranked = [...totals.entries()]
    .map(([userId, v]) => ({
      userId,
      displayName: v.name,
      grabitUserId: v.grabitUserId,
      avatarUrl: resolveImageUrl(v.avatarUrl, "avatar"),
      points: Number.isFinite(v.points) ? v.points : 0,
    }))
    .sort((a, b) => b.points - a.points)
    .map((entry, idx) => ({ ...entry, rank: idx + 1, isCurrentUser: entry.userId === currentUserId }));

  const currentUserEntry = ranked.find((e) => e.isCurrentUser);
  return { entries: ranked.slice(0, 10), currentUserRank: currentUserEntry?.rank ?? null };
}

export async function getFriendActivity(userId: string, limit = 15): Promise<FriendActivityItem[]> {
  const admin = getSupabaseAdminClient();

  const [{ data: sent }, { data: received }, { data: giftsSent }, { data: giftsReceived }] = await Promise.all([
    admin
      .from("point_transfers")
      .select("id, amount, created_at, recipient:recipient_id(full_name, grabit_user_id)")
      .eq("sender_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("point_transfers")
      .select("id, amount, created_at, sender:sender_id(full_name, grabit_user_id)")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("reward_redemptions")
      .select("id, created_at, rewards(name), recipient:gifted_to_user_id(full_name, grabit_user_id)")
      .eq("user_id", userId)
      .not("gifted_to_user_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit),
    admin
      .from("reward_redemptions")
      .select("id, created_at, rewards(name), sender:user_id(full_name, grabit_user_id)")
      .eq("gifted_to_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const items: FriendActivityItem[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (sent ?? []) as any[]) {
    items.push({
      id: `sent:${row.id}`,
      kind: "SENT",
      counterpartName: row.recipient?.full_name || row.recipient?.grabit_user_id || "Campus Student",
      amount: row.amount,
      rewardName: null,
      createdAt: row.created_at,
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (received ?? []) as any[]) {
    items.push({
      id: `received:${row.id}`,
      kind: "RECEIVED",
      counterpartName: row.sender?.full_name || row.sender?.grabit_user_id || "Campus Student",
      amount: row.amount,
      rewardName: null,
      createdAt: row.created_at,
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (giftsSent ?? []) as any[]) {
    items.push({
      id: `giftsent:${row.id}`,
      kind: "GIFT_SENT",
      counterpartName: row.recipient?.full_name || row.recipient?.grabit_user_id || "Campus Student",
      amount: null,
      rewardName: row.rewards?.name ?? "a reward",
      createdAt: row.created_at,
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (giftsReceived ?? []) as any[]) {
    items.push({
      id: `giftreceived:${row.id}`,
      kind: "GIFT_RECEIVED",
      counterpartName: row.sender?.full_name || row.sender?.grabit_user_id || "Campus Student",
      amount: null,
      rewardName: row.rewards?.name ?? "a reward",
      createdAt: row.created_at,
    });
  }

  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
}

export interface MyRewardRedemption {
  id: string;
  rewardName: string;
  pointsSpent: number;
  codeStatus: "GENERATED" | "USED" | "EXPIRED" | "CANCELLED" | "REJECTED";
  redemptionCode: string | null;
  expiresAt: string | null;
  redeemedAt: string | null;
  createdAt: string;
  isGiftReceived: boolean;
  usedOrderNumber: string | null;
}

/** Only the redemption's owner (self-redeemer, or gift recipient) may
 * ever see the plaintext code — enforced here by scoping the query to
 * `userId`, and by only returning the code while the redemption is
 * still GENERATED and unexpired. */
export async function getMyRewardRedemptions(userId: string, limit = 30): Promise<MyRewardRedemption[]> {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("reward_redemptions")
    .select(
      "id, user_id, gifted_to_user_id, points_spent, code_status, redemption_code, expires_at, redeemed_at, created_at, rewards(name), orders!reward_redemptions_order_id_fkey(order_number)",
    )
    .or(`user_id.eq.${userId},gifted_to_user_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  const nowIso = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => {
    let codeStatus = row.code_status as MyRewardRedemption["codeStatus"];
    if (codeStatus === "GENERATED" && row.expires_at && row.expires_at < nowIso) {
      codeStatus = "EXPIRED";
    }
    const codeVisible = codeStatus === "GENERATED";
    return {
      id: row.id,
      rewardName: row.rewards?.name ?? "Reward",
      pointsSpent: row.points_spent,
      codeStatus,
      redemptionCode: codeVisible ? row.redemption_code : null,
      expiresAt: row.expires_at,
      redeemedAt: row.redeemed_at,
      createdAt: row.created_at,
      isGiftReceived: row.gifted_to_user_id === userId,
      usedOrderNumber: row.orders?.order_number ?? null,
    };
  });
}

export async function searchStudents(query: string, excludeUserId: string): Promise<FriendSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  // Strip PostgREST filter-syntax metacharacters before interpolating
  // into .or() — this is a raw string filter, not a parameterized query.
  const safe = trimmed.replace(/[,()%*]/g, "").slice(0, 60);
  if (safe.length < 2) return [];

  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("users")
    .select("id, full_name, grabit_user_id")
    .eq("role", "student")
    .neq("id", excludeUserId)
    .or(`full_name.ilike.%${safe}%,grabit_user_id.ilike.%${safe}%`)
    .limit(10);

  return (data ?? []).map((u) => ({
    userId: u.id,
    displayName: u.full_name || u.grabit_user_id || "Campus Student",
    grabitUserId: u.grabit_user_id,
  }));
}
