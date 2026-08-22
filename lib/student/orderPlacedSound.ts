"use client";

const SOUND_URL = "/sounds/order-placed.mp3";

// Module-scoped, not component state — this must survive across the
// checkout page's own re-renders and outlive the handler's async
// call stack, but it deliberately does NOT persist across a real
// reload/new tab (a fresh page load is a fresh module instance). That's
// intentional: this guard's only job is "never play twice for the one
// order ID that was just confirmed inside this checkout session," not
// "remember forever" — the order tracking page never calls this at all,
// so refresh/navigation/status-change there can never replay a sound.
const playedOrderIds = new Set<string>();

/**
 * Plays the one-shot order-placed notification for a single order ID,
 * exactly once. Call this ONLY from the checkout success handler right
 * after the create-order API call resolves ok — never from the order
 * tracking page's mount/poll/refresh logic, which is what would risk
 * replaying it on every status change or revisit.
 *
 * Safe by construction: a second call with the same orderId (e.g. a
 * defensive double-invoke, or React re-running the handler) is a no-op.
 * play() rejections (autoplay blocked, no user-gesture context, etc.)
 * are swallowed — a blocked sound must never surface as an error or
 * interrupt the order flow.
 */
export function playOrderPlacedSound(orderId: string): void {
  if (!orderId || playedOrderIds.has(orderId)) return;
  playedOrderIds.add(orderId);

  try {
    const audio = new Audio(SOUND_URL);
    audio.volume = 0.6;
    void audio.play().catch(() => {
      // Autoplay blocked or otherwise rejected — fail silently, per spec.
    });
  } catch {
    // Audio construction itself can throw in exotic environments
    // (e.g. certain webviews) — never let this break order placement.
  }
}
