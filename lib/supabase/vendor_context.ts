import { createClient } from "./client";

export interface LiveVendorContext {
  userId: string | null;
  canteenId: string | null;
  shopName: string | null;
  pauseStatus: { isPaused: boolean; reason: string | null } | null;
  role: string | null;
  cachedAt: number;
}

// In-memory cache & in-flight promise deduplicator for vendor context
let cachedVendorContext: LiveVendorContext | null = null;
let inFlightContextPromise: Promise<LiveVendorContext | null> | null = null;
const CONTEXT_CACHE_TTL_MS = 60_000; // 1 minute TTL

/**
 * Invalidate the cached vendor context (e.g., on sign-out, store status update, or refresh)
 */
export function invalidateVendorContextCache(): void {
  cachedVendorContext = null;
  inFlightContextPromise = null;
}

/**
 * Prime or update the vendor context cache directly with known values
 */
export function setCachedVendorContext(data: Partial<LiveVendorContext>): void {
  if (cachedVendorContext) {
    cachedVendorContext = {
      ...cachedVendorContext,
      ...data,
      cachedAt: Date.now(),
    };
  }
}

/**
 * Authoritative, batched resolver for the full vendor context.
 * Performs a single combined query for user role, canteen_id, shop name,
 * and pause status with complete promise deduplication.
 */
export async function getLiveVendorContext(forceRefresh = false): Promise<LiveVendorContext | null> {
  const now = Date.now();
  if (!forceRefresh && cachedVendorContext && now - cachedVendorContext.cachedAt < CONTEXT_CACHE_TTL_MS) {
    return cachedVendorContext;
  }

  if (inFlightContextPromise) {
    return inFlightContextPromise;
  }

  inFlightContextPromise = (async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        cachedVendorContext = null;
        return null;
      }

      const { data: profile, error } = await supabase
        .from("users")
        .select("role, canteen_id, canteens:canteen_id ( name, is_paused, pause_reason )")
        .eq("id", user.id)
        .maybeSingle();

      if (error || !profile || profile.role !== "vendor" || !profile.canteen_id) {
        cachedVendorContext = null;
        return null;
      }

      // Handle joined canteens relation (may be single object or array depending on Supabase typing)
      const canteenData = Array.isArray(profile.canteens)
        ? profile.canteens[0]
        : (profile.canteens as { name?: string; is_paused?: boolean; pause_reason?: string | null } | null);

      const resolvedContext: LiveVendorContext = {
        userId: user.id,
        canteenId: profile.canteen_id,
        shopName: canteenData?.name || null,
        pauseStatus: {
          isPaused: Boolean(canteenData?.is_paused),
          reason: canteenData?.pause_reason || null,
        },
        role: profile.role,
        cachedAt: Date.now(),
      };

      cachedVendorContext = resolvedContext;
      return resolvedContext;
    } catch {
      return null;
    } finally {
      inFlightContextPromise = null;
    }
  })();

  return inFlightContextPromise;
}

/**
 * Client-side resolver for the authenticated vendor's own canteen_id.
 * Returns null if unauthenticated, not a vendor, or unassigned — callers
 * must fail closed (empty state) rather than fall back to any other
 * vendor's data.
 */
export async function getLiveVendorCanteenId(forceRefresh = false): Promise<string | null> {
  const ctx = await getLiveVendorContext(forceRefresh);
  return ctx?.canteenId || null;
}

/**
 * Resolves whether Super Admin has paused this vendor's store, and
 * why, so the dashboard can show a clear "Paused by Super Admin"
 * banner instead of silently blocking new orders.
 */
export async function getLiveVendorPauseStatus(forceRefresh = false): Promise<{
  isPaused: boolean;
  reason: string | null;
} | null> {
  const ctx = await getLiveVendorContext(forceRefresh);
  return ctx?.pauseStatus || null;
}

/**
 * Resolves the authenticated vendor's own store/shop name, for header
 * display. Falls back to null (never "undefined"/"null") so callers can
 * show a safe default like "GrabIt".
 */
export async function getLiveVendorShopName(forceRefresh = false): Promise<string | null> {
  const ctx = await getLiveVendorContext(forceRefresh);
  return ctx?.shopName || null;
}
