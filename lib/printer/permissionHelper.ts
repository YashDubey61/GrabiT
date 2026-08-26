import { openAppSettings } from "@/lib/capacitor/settings";
import { getThermalPrinterPlugin } from "./nativePlugin";
import type { PermissionStatus } from "./types";

const getNativePlugin = getThermalPrinterPlugin;

/**
 * Checks current Bluetooth and Notification permissions
 */
export async function checkPermissions(): Promise<PermissionStatus> {
  const plugin = getNativePlugin();
  if (!plugin) {
    // In web browser / emulator fallback mode:
    return {
      bluetoothGranted: true,
      notificationsGranted: true,
      bluetoothEnabled: true,
      isPermanentlyDenied: false,
    };
  }

  try {
    const res = await plugin.checkPrinterPermissions();
    const isDenied = !res.bluetoothGranted;

    return {
      bluetoothGranted: res.bluetoothGranted,
      notificationsGranted: res.notificationsGranted,
      bluetoothEnabled: res.bluetoothEnabled,
      isPermanentlyDenied: isDenied,
    };
  } catch (err) {
    console.error("[permissionHelper] Error checking permissions:", err);
    return {
      bluetoothGranted: false,
      notificationsGranted: false,
      bluetoothEnabled: false,
      isPermanentlyDenied: true,
    };
  }
}

/**
 * Requests Bluetooth permissions from the system dialog
 */
export async function requestPermissions(): Promise<PermissionStatus> {
  const plugin = getNativePlugin();
  if (!plugin) {
    return {
      bluetoothGranted: true,
      notificationsGranted: true,
      bluetoothEnabled: true,
      isPermanentlyDenied: false,
    };
  }

  try {
    const res = await plugin.requestPrinterPermissions();
    if (res.bluetoothGranted) {
      // Auto-clear any previously posted Bluetooth permission notification
      await clearPermissionNotification("bluetooth");
    }
    return {
      bluetoothGranted: res.bluetoothGranted,
      notificationsGranted: res.notificationsGranted,
      bluetoothEnabled: res.bluetoothEnabled,
      isPermanentlyDenied: !res.bluetoothGranted,
    };
  } catch (err) {
    console.error("[permissionHelper] Error requesting permissions:", err);
    return checkPermissions();
  }
}

/**
 * Triggers a high-priority actionable Android notification in the "GRABIT Permissions" channel
 * that opens the GRABIT Vendor App Info -> Permissions screen when tapped.
 */
export async function showPermissionNotification(
  permissionType: "bluetooth" | "camera" | "location" | "notifications" = "bluetooth",
  title = "GRABIT Vendor — Permission Required",
  message = "Bluetooth permission is required to connect and print using your thermal printer. Tap here to enable it."
): Promise<boolean> {
  const plugin = getNativePlugin();
  if (!plugin) return false;

  try {
    await plugin.showPermissionNotification({
      permissionType,
      title,
      message,
    });
    return true;
  } catch (err) {
    console.warn("[permissionHelper] Could not show permission notification:", err);
    return false;
  }
}

/**
 * Clears the active notification once the user grants permission
 */
export async function clearPermissionNotification(
  permissionType: "bluetooth" | "camera" | "location" | "notifications" = "bluetooth"
): Promise<boolean> {
  const plugin = getNativePlugin();
  if (!plugin) return false;

  try {
    await plugin.clearPermissionNotification({ permissionType });
    return true;
  } catch (err) {
    console.warn("[permissionHelper] Could not clear permission notification:", err);
    return false;
  }
}

/**
 * Opens the application's Android permission / settings page directly.
 */
export async function openSettingsPage(): Promise<void> {
  await openAppSettings();
}
