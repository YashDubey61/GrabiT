/** Custom URL scheme registered by the Android app (see
 * capacitor.config.ts + AndroidManifest intent-filter). Supabase
 * redirects here after Google auth so the system browser hands control
 * back to the app instead of stranding the user on a web page. */
export const NATIVE_AUTH_REDIRECT = "app.grabit.student://auth/callback";

/** True only inside the Capacitor native shell. Guarded so the same
 * code is safe to run during SSR and in a normal browser tab. */
export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return cap?.isNativePlatform?.() ?? false;
}
