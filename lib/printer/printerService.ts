import type { ReceiptOrder } from "@/components/shared/receipt-printer/types";
import {
  buildKitchenReceiptEscPos,
  buildTestPrintEscPos,
  uint8ArrayToBase64,
} from "./escpos";
import {
  checkPermissions,
  clearPermissionNotification,
  requestPermissions,
  showPermissionNotification,
} from "./permissionHelper";
import {
  getDefaultPrinterId,
  getGlobalPaperWidth,
  loadSavedPrinters,
  removePrinterFromStorage,
  savePrinterToStorage,
  setDefaultPrinterId,
  setGlobalPaperWidth,
} from "./printerStorage";
import { getThermalPrinterPlugin, type ThermalPrinterNativePlugin } from "./nativePlugin";
import type {
  PaperWidth,
  PrinterDevice,
  PrinterStatus,
  PrintOptions,
  PrintResult,
  TestPrintData,
} from "./types";

class PrinterService {
  private status: PrinterStatus = "disconnected";
  private activePrinter: PrinterDevice | null = null;
  private statusListeners = new Set<(status: PrinterStatus, printer: PrinterDevice | null) => void>();
  private isScanning = false;
  private scanListeners = new Set<(devices: PrinterDevice[], scanning: boolean) => void>();
  private discoveredDevices: Map<string, PrinterDevice> = new Map();

  constructor() {
    if (typeof window !== "undefined") {
      this.initSavedPrinter();
      // Listen for window focus/resume to clear notifications when granted
      window.addEventListener("focus", () => {
        this.handleAppResume();
      });
    }
  }

  private initSavedPrinter() {
    const defaultId = getDefaultPrinterId();
    const saved = loadSavedPrinters();
    if (defaultId) {
      const found = saved.find((p) => p.id === defaultId);
      if (found) {
        this.activePrinter = found;
      }
    } else if (saved.length > 0) {
      this.activePrinter = saved[0];
      setDefaultPrinterId(saved[0].id);
    }
  }

  public async handleAppResume() {
    try {
      const perms = await checkPermissions();
      if (perms.bluetoothGranted) {
        await clearPermissionNotification("bluetooth");
      }
    } catch {}
  }

  public getStatus(): PrinterStatus {
    return this.status;
  }

  public getActivePrinter(): PrinterDevice | null {
    if (!this.activePrinter) {
      this.initSavedPrinter();
    }
    return this.activePrinter;
  }

  public getSavedPrinters(): PrinterDevice[] {
    return loadSavedPrinters();
  }

  public getPaperWidth(): PaperWidth {
    if (this.activePrinter?.paperWidth) {
      return this.activePrinter.paperWidth;
    }
    return getGlobalPaperWidth();
  }

  public setPaperWidth(width: PaperWidth) {
    setGlobalPaperWidth(width);
    if (this.activePrinter) {
      this.activePrinter.paperWidth = width;
      savePrinterToStorage(this.activePrinter);
      this.notifyStatus();
    }
  }

  public onStatusChange(callback: (status: PrinterStatus, printer: PrinterDevice | null) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status, this.activePrinter);
    return () => this.statusListeners.delete(callback);
  }

  public onScanUpdate(callback: (devices: PrinterDevice[], scanning: boolean) => void): () => void {
    this.scanListeners.add(callback);
    callback(Array.from(this.discoveredDevices.values()), this.isScanning);
    return () => this.scanListeners.delete(callback);
  }

  private notifyStatus() {
    this.statusListeners.forEach((listener) => listener(this.status, this.activePrinter));
  }

  private notifyScan() {
    const list = Array.from(this.discoveredDevices.values());
    this.scanListeners.forEach((listener) => listener(list, this.isScanning));
  }

  private getNative(): ThermalPrinterNativePlugin | null {
    return getThermalPrinterPlugin();
  }

  // ==========================================
  // Device Discovery & Scanning
  // ==========================================

  public async getBondedPrinters(): Promise<PrinterDevice[]> {
    const native = this.getNative();
    if (!native) {
      // In web/emulator development fallback:
      return [
        {
          id: "EMULATOR-BT-58",
          name: "Kitchen Thermal 58 (Simulated)",
          type: "bluetooth",
          address: "00:11:22:33:44:55",
          bonded: true,
          isDefault: true,
          paperWidth: "58mm",
        },
      ];
    }

    try {
      const perms = await checkPermissions();
      if (!perms.bluetoothGranted) {
        const req = await requestPermissions();
        if (!req.bluetoothGranted) {
          await showPermissionNotification("bluetooth");
          throw new Error("Bluetooth permission required to discover printers");
        }
      }

      const res = await native.getBondedDevices();
      const defaultId = getDefaultPrinterId();
      const devices: PrinterDevice[] = (res.devices || []).map((d: any) => ({
        id: d.address,
        name: d.name || "Bluetooth Printer",
        type: "bluetooth",
        address: d.address,
        bonded: true,
        isDefault: d.address === defaultId,
        paperWidth: getGlobalPaperWidth(),
      }));

      // Cache into discovered map
      devices.forEach((d) => this.discoveredDevices.set(d.id, d));
      this.notifyScan();

      return devices;
    } catch (err: any) {
      console.error("[printerService] Error fetching bonded printers:", err);
      throw err;
    }
  }

  public async startScan(): Promise<void> {
    const native = this.getNative();
    this.isScanning = true;
    this.notifyScan();

    if (!native) {
      // Browser simulation
      setTimeout(() => {
        const sim1: PrinterDevice = {
          id: "00:22:33:44:55:66",
          name: "POS-58 Bluetooth",
          type: "bluetooth",
          address: "00:22:33:44:55:66",
          bonded: false,
          paperWidth: "58mm",
        };
        const sim2: PrinterDevice = {
          id: "00:33:44:55:66:77",
          name: "MTP-80 Thermal",
          type: "bluetooth",
          address: "00:33:44:55:66:77",
          bonded: false,
          paperWidth: "80mm",
        };
        this.discoveredDevices.set(sim1.id, sim1);
        this.discoveredDevices.set(sim2.id, sim2);
        this.isScanning = false;
        this.notifyScan();
      }, 1500);
      return;
    }

    try {
      const perms = await checkPermissions();
      if (!perms.bluetoothGranted) {
        const req = await requestPermissions();
        if (!req.bluetoothGranted) {
          this.isScanning = false;
          this.notifyScan();
          await showPermissionNotification("bluetooth");
          throw new Error("Bluetooth permission required to scan nearby printers");
        }
      }

      // Load bonded first
      await this.getBondedPrinters();

      // Listen for discovered events
      await native.removeAllListeners({ eventName: "printerDiscovered" });
      await native.removeAllListeners({ eventName: "scanFinished" });

      await native.addListener("printerDiscovered", (device: any) => {
        if (!device || !device.address) return;
        const mapped: PrinterDevice = {
          id: device.address,
          name: device.name || "Bluetooth Printer",
          type: "bluetooth",
          address: device.address,
          bonded: Boolean(device.bonded),
          paperWidth: getGlobalPaperWidth(),
        };
        this.discoveredDevices.set(mapped.id, mapped);
        this.notifyScan();
      });

      await native.addListener("scanFinished", () => {
        this.isScanning = false;
        this.notifyScan();
      });

      await native.startScan();
    } catch (err: any) {
      this.isScanning = false;
      this.notifyScan();
      throw err;
    }
  }

  public async stopScan(): Promise<void> {
    this.isScanning = false;
    const native = this.getNative();
    if (native) {
      try {
        await native.stopScan();
      } catch {}
    }
    this.notifyScan();
  }

  // ==========================================
  // Printer Selection & Management
  // ==========================================

  public selectPrinter(printer: PrinterDevice, makeDefault: boolean = true): void {
    const width = printer.paperWidth || getGlobalPaperWidth();
    const updatedPrinter: PrinterDevice = {
      ...printer,
      paperWidth: width,
      isDefault: makeDefault,
      lastConnectedAt: Date.now(),
    };

    savePrinterToStorage(updatedPrinter);
    if (makeDefault) {
      setDefaultPrinterId(updatedPrinter.id);
    }
    this.activePrinter = updatedPrinter;
    this.status = "connected";
    this.notifyStatus();
  }

  public removePrinter(printerId: string): void {
    removePrinterFromStorage(printerId);
    if (this.activePrinter?.id === printerId) {
      const remaining = loadSavedPrinters();
      this.activePrinter = remaining.length > 0 ? remaining[0] : null;
      this.status = this.activePrinter ? "connected" : "disconnected";
      this.notifyStatus();
    }
  }

  public addWifiPrinter(name: string, ip: string, port: number = 9100, paperWidth: PaperWidth = "80mm"): PrinterDevice {
    const trimmedIp = ip.trim();
    const id = `wifi_${trimmedIp}_${port}`;
    const device: PrinterDevice = {
      id,
      name: name.trim() || `Wi-Fi Printer (${trimmedIp})`,
      type: "wifi",
      ip: trimmedIp,
      port,
      paperWidth,
      isDefault: loadSavedPrinters().length === 0,
      lastConnectedAt: Date.now(),
    };

    savePrinterToStorage(device);
    if (device.isDefault) {
      setDefaultPrinterId(device.id);
      this.activePrinter = device;
    }
    this.notifyStatus();
    return device;
  }

  // ==========================================
  // Connection Lifecycle
  // ==========================================

  public async connectPrinter(printer?: PrinterDevice): Promise<boolean> {
    const target = printer || this.getActivePrinter();
    if (!target) {
      throw new Error("No printer selected. Please select or add a thermal printer.");
    }

    this.activePrinter = target;
    this.status = "connecting";
    this.notifyStatus();

    const native = this.getNative();
    if (!native) {
      // In web simulation
      await new Promise((r) => setTimeout(r, 600));
      this.status = "connected";
      this.notifyStatus();
      return true;
    }

    if (target.type === "bluetooth") {
      if (!target.address) {
        this.status = "failed";
        this.notifyStatus();
        throw new Error("Bluetooth address is missing");
      }

      try {
        const perms = await checkPermissions();
        if (!perms.bluetoothGranted) {
          const req = await requestPermissions();
          if (!req.bluetoothGranted) {
            this.status = "failed";
            this.notifyStatus();
            await showPermissionNotification("bluetooth");
            throw new Error("Bluetooth permission required");
          }
        }

        const res = await native.connect({ address: target.address });
        if (res.connected) {
          this.status = "connected";
          this.notifyStatus();
          return true;
        } else {
          this.status = "failed";
          this.notifyStatus();
          return false;
        }
      } catch (err: any) {
        this.status = "failed";
        this.notifyStatus();
        throw err;
      }
    } else if (target.type === "wifi") {
      // Wi-Fi connects on-demand during print command
      this.status = "connected";
      this.notifyStatus();
      return true;
    } else if (target.type === "usb") {
      this.status = "connected";
      this.notifyStatus();
      return true;
    }

    return true;
  }

  public async disconnectPrinter(): Promise<void> {
    const native = this.getNative();
    if (native) {
      try {
        await native.disconnect();
      } catch {}
    }
    this.status = "disconnected";
    this.notifyStatus();
  }

  // ==========================================
  // Printing Execution
  // ==========================================

  public async printReceipt(order: ReceiptOrder, options?: PrintOptions): Promise<PrintResult> {
    const printer = this.getActivePrinter();
    if (!printer) {
      return {
        success: false,
        error: "No printer connected. Please connect a thermal printer.",
        code: "NO_PRINTER",
      };
    }

    const paperWidth = options?.paperWidth || printer.paperWidth || getGlobalPaperWidth();
    const rawBytes = buildKitchenReceiptEscPos(order, paperWidth);
    return this.sendRawToPrinter(printer, rawBytes);
  }

  public async testPrint(printerOverride?: PrinterDevice): Promise<PrintResult> {
    const printer = printerOverride || this.getActivePrinter();
    if (!printer) {
      return {
        success: false,
        error: "No printer configured to test.",
        code: "NO_PRINTER",
      };
    }

    const paperWidth = printer.paperWidth || getGlobalPaperWidth();
    const testData: TestPrintData = {
      printerName: printer.name,
      paperWidth,
      connectionType: printer.type,
      addressOrIp: printer.address || (printer.ip ? `${printer.ip}:${printer.port || 9100}` : undefined),
    };

    const rawBytes = buildTestPrintEscPos(testData);
    return this.sendRawToPrinter(printer, rawBytes);
  }

  private async sendRawToPrinter(printer: PrinterDevice, rawBytes: Uint8Array): Promise<PrintResult> {
    this.status = "printing";
    this.notifyStatus();

    const base64Data = uint8ArrayToBase64(rawBytes);
    const native = this.getNative();

    if (!native) {
      // Browser simulation
      await new Promise((r) => setTimeout(r, 1200));
      this.status = "printed";
      this.notifyStatus();
      setTimeout(() => {
        this.status = "connected";
        this.notifyStatus();
      }, 2500);
      return { success: true, bytesWritten: rawBytes.length };
    }

    try {
      if (printer.type === "bluetooth") {
        // Auto-reconnect if needed
        const connCheck = await native.isConnected();
        if (!connCheck.connected || connCheck.address !== printer.address) {
          if (!printer.address) throw new Error("Printer Bluetooth address not specified");
          await native.connect({ address: printer.address });
        }

        const res = await native.printRaw({ data: base64Data });
        if (res.success) {
          this.status = "printed";
          this.notifyStatus();
          setTimeout(() => {
            this.status = "connected";
            this.notifyStatus();
          }, 2500);
          return { success: true, bytesWritten: res.bytesWritten };
        } else {
          this.status = "failed";
          this.notifyStatus();
          return { success: false, error: "Print command failed to complete." };
        }
      } else if (printer.type === "wifi") {
        if (!printer.ip) throw new Error("Printer IP address is required");
        const res = await native.printWifi({
          ip: printer.ip,
          port: printer.port || 9100,
          data: base64Data,
          timeout: 5000,
        });
        if (res.success) {
          this.status = "printed";
          this.notifyStatus();
          setTimeout(() => {
            this.status = "connected";
            this.notifyStatus();
          }, 2500);
          return { success: true, bytesWritten: res.bytesWritten };
        } else {
          this.status = "failed";
          this.notifyStatus();
          return { success: false, error: "Wi-Fi print failed." };
        }
      } else if (printer.type === "usb") {
        if (printer.deviceId == null) throw new Error("USB printer device ID missing");
        const res = await native.printUsb({
          deviceId: printer.deviceId,
          data: base64Data,
        });
        if (res.success) {
          this.status = "printed";
          this.notifyStatus();
          setTimeout(() => {
            this.status = "connected";
            this.notifyStatus();
          }, 2500);
          return { success: true, bytesWritten: res.bytesWritten };
        } else {
          this.status = "failed";
          this.notifyStatus();
          return { success: false, error: "USB print failed." };
        }
      }

      this.status = "failed";
      this.notifyStatus();
      return { success: false, error: "Unsupported printer connection type" };
    } catch (err: any) {
      console.error("[printerService] Print error:", err);
      this.status = "failed";
      this.notifyStatus();
      return {
        success: false,
        error: err?.message || "Printer communication error. Please check printer power and connection.",
        code: err?.code || "PRINT_ERROR",
      };
    }
  }
}

// Global Singleton Export
export const printerService = new PrinterService();
