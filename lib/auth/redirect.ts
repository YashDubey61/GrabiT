import { ROLE_HOME } from "@/lib/auth/roles";
import type { UserRole } from "@/types";

/**
 * Sanitizes a `?next=` redirect target so it can only point back into
 * this app. Rejects protocol-relative ("//host"), absolute ("https://"),
 * and backslash-based ("\\host") open-redirect payloads.
 */
export function getSafeRedirectUrl(next: string | null | undefined, role: UserRole): string {
  const fallback = ROLE_HOME[role] || "/customer";
  if (!next) return fallback;

  const trimmed = next.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.includes(":") &&
    !trimmed.includes("\\")
  ) {
    return trimmed;
  }
  return fallback;
}

/**
 * Forces a full document navigation instead of a Next.js client-side
 * transition. Required for the post-login redirect specifically: the
 * App Router's client Router Cache can replay a *pre-login* prefetch of
 * the destination route (captured while the user was unauthenticated,
 * i.e. the middleware's own redirect-to-login response) instead of
 * re-running middleware against the just-established session cookies.
 * A hard navigation always issues a fresh request, so middleware always
 * re-evaluates with current cookies — this is what makes the redirect
 * land reliably instead of bouncing back to the auth page.
 */
export function hardNavigate(url: string): void {
  window.location.assign(url);
}

/**
 * Same full-document-navigation guarantee as `hardNavigate`, but replaces
 * the current history entry instead of pushing a new one. Use this for
 * "already authenticated, bounce away from this page" redirects that can
 * fire again on their own target (e.g. the Android back button returning
 * to /vendor/auth, which immediately re-redirects to /vendor) — pushing
 * there would grow WebView history without bound, so `canGoBack` never
 * turns false and the app's back-button priority chain can never reach
 * its terminal "no history left" step.
 */
export function hardReplace(url: string): void {
  window.location.replace(url);
}

export function authLog(...args: unknown[]): void {
  if (process.env.NODE_ENV !== "production") {
    console.log("[AUTH]", ...args);
  }
}

export function authError(...args: unknown[]): void {
  console.error("[AUTH ERROR]", ...args);
}

/**
 * For expected, user-correctable auth outcomes (wrong role for this
 * portal, missing role assignment) — not application errors. Uses
 * console.warn so the dev overlay/browser console doesn't flag a normal
 * fail-closed rejection as a red error.
 */
export function authReject(...args: unknown[]): void {
  console.warn("[AUTH REJECTED]", ...args);
}
