import type { ReceiptOrder } from "@/components/shared/receipt-printer/types";

export type ConnectionType = "bluetooth" | "wifi" | "usb";
export type PaperWidth = "58mm" | "80mm";

export type PrinterStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "printing"
  | "printed"
  | "failed";

export interface PrinterDevice {
  id: string; // MAC address for BT, "ip:port" for WiFi, or deviceId for USB
  name: string;
  type: ConnectionType;
  address?: string; // MAC address
  ip?: string;
  port?: number;
  deviceId?: number; // USB deviceId
  vendorId?: number;
  productId?: number;
  bonded?: boolean;
  isDefault?: boolean;
  paperWidth: PaperWidth;
  lastConnectedAt?: number;
}

export interface PrintResult {
  success: boolean;
  bytesWritten?: number;
  error?: string;
  code?: string;
}

export interface PermissionStatus {
  bluetoothGranted: boolean;
  notificationsGranted: boolean;
  bluetoothEnabled: boolean;
  isPermanentlyDenied?: boolean;
}

export interface PrintOptions {
  paperWidth?: PaperWidth;
  cutPaper?: boolean;
  copies?: number;
}

export interface TestPrintData {
  printerName: string;
  paperWidth: PaperWidth;
  connectionType: ConnectionType;
  addressOrIp?: string;
}
