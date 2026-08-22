/**
 * Minimal in-memory sliding-window rate limiter for custom API routes that
 * don't already sit behind Supabase Auth's own built-in throttling (e.g.
 * signInWithPassword/signUp). Resets per server instance/deploy — there is
 * no shared store (Redis/Upstash) in this project yet, so this is a
 * best-effort mitigation for a single-instance deployment, not a hard
 * guarantee under a multi-instance/serverless fleet. Follows the same
 * pattern already used for the pickup OTP limiter in
 * lib/supabase/pickup_qr_verify.ts.
 */

const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  limited: boolean;
  remaining: number;
}

/**
 * `key` should already include the route/action name so limits for
 * different endpoints never collide on the same identity (e.g.
 * `password-reset:${email}` or `password-reset-ip:${ip}`).
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const attempts = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  attempts.push(now);
  buckets.set(key, attempts);
  return { limited: attempts.length > limit, remaining: Math.max(0, limit - attempts.length) };
}

/** Best-effort client identifier for rate-limiting unauthenticated requests.
 * Spoofable via X-Forwarded-For — acceptable here since it only widens or
 * narrows a soft throttle, never an access-control decision. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}
