import { registerPlugin } from "@capacitor/core";
import { isNativePlatform } from "./platform";

interface NativeSettingsPluginType {
  openAppSettings: () => Promise<void>;
}

// Two compounding Capacitor gotchas:
//  1. registerPlugin() warns and returns a broken registration if called
//     twice for the same plugin name, so this is registered once and cached
//     rather than on every openAppSettings() call.
//  2. The object registerPlugin() returns is a Proxy whose `get` trap
//     answers *any* property access (including `.then`) with a callable
//     function. Returning/awaiting that proxy through a Promise boundary
//     makes the JS runtime treat it as a thenable and call
//     `proxy.then(resolve, reject)` — which throws
//     "NativeSettings.then() is not implemented on android". Keeping the
//     resolver synchronous (static import, no async/await around it) avoids
//     that entirely.
let cachedPlugin: NativeSettingsPluginType | null | undefined;

function getNativeSettingsPlugin(): NativeSettingsPluginType | null {
  if (cachedPlugin !== undefined) return cachedPlugin;
  try {
    cachedPlugin = registerPlugin<NativeSettingsPluginType>("NativeSettings");
    return cachedPlugin;
  } catch (err) {
    console.warn("[settings] Could not register NativeSettings plugin:", err);
    return null;
  }
}

/**
 * Opens the application's details / permission settings in Android OS.
 * Safe to call in browser and native environments.
 */
export async function openAppSettings(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (isNativePlatform()) {
    try {
      const NativeSettings = getNativeSettingsPlugin();
      if (!NativeSettings) return false;
      await NativeSettings.openAppSettings();
      return true;
    } catch (err) {
      console.warn("[settings] Could not open native app settings via plugin:", err);
    }
  }

  // Web fallback: instructions or prompt if not in native shell
  return false;
}
