/**
 * Unified GPS location resolver — GrabIt Campus Canteen OS.
 *
 * One `getUserLocation()` for both surfaces: on the Android app it uses
 * @capacitor/geolocation (native location services); in a normal
 * browser tab it falls back to `navigator.geolocation`. Neither path
 * touches any paid API — this is pure device GPS.
 *
 * Callers must only invoke this in direct response to a user tapping
 * "Auto-Detect Campus via GPS" or a vendor location action — it triggers
 * the OS permission prompt, so calling it on page load would surprise
 * the user with a permission dialog before they asked for one.
 */

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type LocationErrorStatus =
  | "DENIED"
  | "PERMANENTLY_DENIED"
  | "TIMEOUT"
  | "UNAVAILABLE"
  | "UNSUPPORTED";

export interface UserLocationResult {
  result?: UserLocation;
  errorStatus?: LocationErrorStatus;
  isPermanentlyDenied?: boolean;
}

const DEFAULT_TIMEOUT_MS = 8000;

/** True only inside the Capacitor native shell — guarded so this is
 * safe to evaluate during SSR and in a plain browser tab. */
export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  return cap?.isNativePlatform?.() ?? false;
}

/** Check current location permission without prompting the user. */
export async function checkLocationPermission(): Promise<"granted" | "denied" | "prompt" | "unknown"> {
  if (typeof window === "undefined") return "unknown";

  if (isNativePlatform()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const status = await Geolocation.checkPermissions();
      if (status.location === "granted" || status.coarseLocation === "granted") {
        return "granted";
      }
      if (status.location === "denied" || status.coarseLocation === "denied") {
        return "denied";
      }
      return "prompt";
    } catch {
      return "unknown";
    }
  }

  if (navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      return status.state;
    } catch {
      return "unknown";
    }
  }

  return "unknown";
}

async function getNativeLocation(timeoutMs: number): Promise<UserLocationResult> {
  try {
    const { Geolocation } = await import("@capacitor/geolocation");

    // 1. Check existing permission status before requesting
    const currentStatus = await Geolocation.checkPermissions();
    let isGranted = currentStatus.location === "granted" || currentStatus.coarseLocation === "granted";

    // 2. If not granted, request permission
    if (!isGranted) {
      const reqStatus = await Geolocation.requestPermissions({
        permissions: ["location", "coarseLocation"],
      });
      isGranted = reqStatus.location === "granted" || reqStatus.coarseLocation === "granted";

      if (!isGranted) {
        const isPermanentlyDenied = reqStatus.location === "denied" && reqStatus.coarseLocation === "denied";
        return {
          errorStatus: isPermanentlyDenied ? "PERMANENTLY_DENIED" : "DENIED",
          isPermanentlyDenied,
        };
      }
    }

    // 3. Obtain position with GPS fallback
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
      return { errorStatus: "DENIED", isPermanentlyDenied: message.includes("permanent") };
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
        resolve({
          errorStatus: err.code === err.PERMISSION_DENIED ? "DENIED" : "UNAVAILABLE",
          isPermanentlyDenied: err.code === err.PERMISSION_DENIED,
        });
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
