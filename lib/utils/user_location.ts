/**
 * Unified GPS location resolver — GrabIt Campus Canteen OS.
 *
 * One `getUserLocation()` for both surfaces: on the Android app it uses
 * @capacitor/geolocation (native location services); in a normal
 * browser tab it falls back to `navigator.geolocation`. Neither path
 * touches any paid API — this is pure device GPS.
 *
 * Callers must only invoke this in direct response to a user tapping
 * "Auto-Detect Campus via GPS" — it triggers the OS permission prompt,
 * so calling it on page load would surprise the user with a permission
 * dialog before they asked for one.
 */

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type LocationErrorStatus =
  | "DENIED"
  | "TIMEOUT"
  | "UNAVAILABLE"
  | "UNSUPPORTED";

export interface UserLocationResult {
  result?: UserLocation;
  errorStatus?: LocationErrorStatus;
}

const DEFAULT_TIMEOUT_MS = 8000;

/** True only inside the Capacitor native shell — guarded so this is
 * safe to evaluate during SSR and in a plain browser tab. */
function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  return cap?.isNativePlatform?.() ?? false;
}

async function getNativeLocation(timeoutMs: number): Promise<UserLocationResult> {
  try {
    const { Geolocation } = await import("@capacitor/geolocation");

    const permission = await Geolocation.requestPermissions();
    if (permission.location === "denied" || permission.coarseLocation === "denied") {
      return { errorStatus: "DENIED" };
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: timeoutMs,
      maximumAge: 0,
    });

    return {
      result: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      },
    };
  } catch (err) {
    const code = (err as { code?: number; message?: string })?.code;
    const message = (err as { message?: string })?.message?.toLowerCase() ?? "";
    if (code === 1 || message.includes("denied") || message.includes("permission")) {
      return { errorStatus: "DENIED" };
    }
    if (code === 3 || message.includes("timeout")) {
      return { errorStatus: "TIMEOUT" };
    }
    return { errorStatus: "UNAVAILABLE" };
  }
}

function getWebLocation(timeoutMs: number): Promise<UserLocationResult> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      resolve({ errorStatus: "UNSUPPORTED" });
      return;
    }

    let isHandled = false;
    const timer = setTimeout(() => {
      if (!isHandled) {
        isHandled = true;
        resolve({ errorStatus: "TIMEOUT" });
      }
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (isHandled) return;
        isHandled = true;
        clearTimeout(timer);
        resolve({
          result: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
        });
      },
      (err) => {
        if (isHandled) return;
        isHandled = true;
        clearTimeout(timer);
        resolve({ errorStatus: err.code === err.PERMISSION_DENIED ? "DENIED" : "UNAVAILABLE" });
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  });
}

/** Resolves the device's current GPS coordinates — native Geolocation
 * on Android, browser Geolocation on the web. Requests permission at
 * call time; call this only from an explicit user action. */
export async function getUserLocation(
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<UserLocationResult> {
  return isNativePlatform() ? getNativeLocation(timeoutMs) : getWebLocation(timeoutMs);
}
