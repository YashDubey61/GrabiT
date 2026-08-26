import { registerPlugin } from "@capacitor/core";
import { isNativePlatform } from "@/lib/capacitor/platform";

/**
 * Two compounding Capacitor gotchas made ThermalPrinter calls unreliable:
 *  1. registerPlugin() warns and returns a broken registration if called
 *     twice for the same name. printerService.ts and permissionHelper.ts
 *     each used to call registerPlugin("ThermalPrinter") independently
 *     (and printerService.ts did so on every call, uncached). This module
 *     is the single place that registers it now; every caller shares the
 *     cached result instead.
 *  2. The object registerPlugin() returns is a Proxy whose `get` trap
 *     answers *any* property access (including `.then`) with a callable
 *     function. Handing that proxy back as the resolved value of an
 *     `async` function (or `await`ing it directly) makes the JS runtime
 *     treat it as a thenable and call `proxy.then(resolve, reject)` —
 *     which throws "ThermalPrinter.then() is not implemented on android",
 *     since "then" isn't a real plugin method. Keeping this resolver
 *     synchronous (a static import, no async/await anywhere in it or at
 *     its call sites) means the proxy is never passed through a Promise
 *     boundary, so that auto-chasing never triggers.
 */
export interface ThermalPrinterNativePlugin {
  checkPrinterPermissions: () => Promise<{
    bluetoothGranted: boolean;
    notificationsGranted: boolean;
    bluetoothEnabled: boolean;
  }>;
  requestPrinterPermissions: () => Promise<{
    bluetoothGranted: boolean;
    notificationsGranted: boolean;
    bluetoothEnabled: boolean;
  }>;
  showPermissionNotification: (options: {
    permissionType: string;
    title: string;
    message: string;
  }) => Promise<{ posted: boolean; notificationId: number }>;
  clearPermissionNotification: (options: {
    permissionType: string;
  }) => Promise<{ cleared: boolean }>;
  getBondedDevices: () => Promise<{ devices: any[] }>;
  startScan: () => Promise<{ scanning: boolean }>;
  stopScan: () => Promise<{ scanning: boolean }>;
  connect: (options: { address: string }) => Promise<{ connected: boolean; address: string }>;
  disconnect: () => Promise<{ connected: boolean }>;
  isConnected: () => Promise<{ connected: boolean; address?: string }>;
  printRaw: (options: { data: string }) => Promise<{ success: boolean; bytesWritten: number }>;
  printWifi: (options: { ip: string; port?: number; data: string; timeout?: number }) => Promise<{ success: boolean; bytesWritten: number }>;
  getUsbPrinters: () => Promise<{ devices: any[] }>;
  printUsb: (options: { deviceId: number; data: string }) => Promise<{ success: boolean; bytesWritten: number }>;
  addListener: (eventName: string, listener: (data: any) => void) => Promise<any>;
  removeAllListeners: (options?: { eventName: string }) => Promise<void>;
}

let cachedPlugin: ThermalPrinterNativePlugin | null | undefined;

export function getThermalPrinterPlugin(): ThermalPrinterNativePlugin | null {
  if (!isNativePlatform() || typeof window === "undefined") return null;
  if (cachedPlugin !== undefined) return cachedPlugin;
  try {
    cachedPlugin = registerPlugin<ThermalPrinterNativePlugin>("ThermalPrinter");
    return cachedPlugin;
  } catch (err) {
    console.warn("[nativePlugin] Could not register ThermalPrinter native plugin:", err);
    return null;
  }
}
