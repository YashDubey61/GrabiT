"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import type { ReceiptOrder } from "@/components/shared/receipt-printer/types";
import { printerService } from "@/lib/printer/printerService";
import {
  checkPermissions,
  openSettingsPage,
  requestPermissions,
  showPermissionNotification,
} from "@/lib/printer/permissionHelper";
import type {
  PaperWidth,
  PermissionStatus,
  PrinterDevice,
  PrinterStatus,
  PrintResult,
} from "@/lib/printer/types";
import { wrapText, formatRow } from "@/lib/printer/escpos";
import { useModalBackHandler } from "@/lib/navigation/backButtonManager";

interface ThermalPrinterModalProps {
  open: boolean;
  onClose: () => void;
  order?: ReceiptOrder | null;
  onPrinted?: () => void;
  autoPrintOnOpen?: boolean;
}

export function ThermalPrinterModal({
  open,
  onClose,
  order,
  onPrinted,
  autoPrintOnOpen = false,
}: ThermalPrinterModalProps) {
  useModalBackHandler(open, onClose, "thermal-printer-modal");
  const [activePrinter, setActivePrinter] = useState<PrinterDevice | null>(null);
  const [status, setStatus] = useState<PrinterStatus>("disconnected");
  const [savedPrinters, setSavedPrinters] = useState<PrinterDevice[]>([]);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<PrinterDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [paperWidth, setPaperWidthState] = useState<PaperWidth>("58mm");
  const [activeTab, setActiveTab] = useState<"bluetooth" | "wifi" | "saved">("bluetooth");

  // Wi-Fi form state
  const [wifiIp, setWifiIp] = useState("");
  const [wifiPort, setWifiPort] = useState("9100");
  const [wifiName, setWifiName] = useState("");

  // Feedback & Preview states
  const [printError, setPrintError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [permStatus, setPermStatus] = useState<PermissionStatus | null>(null);

  // Subscribe to service changes
  useEffect(() => {
    if (!open) return;

    const unsubStatus = printerService.onStatusChange((newStatus, currentPrinter) => {
      setStatus(newStatus);
      setActivePrinter(currentPrinter);
      if (currentPrinter?.paperWidth) {
        setPaperWidthState(currentPrinter.paperWidth);
      }
    });

    const unsubScan = printerService.onScanUpdate((devices, scanning) => {
      setDiscoveredPrinters(devices);
      setIsScanning(scanning);
    });

    setSavedPrinters(printerService.getSavedPrinters());
    setPaperWidthState(printerService.getPaperWidth());

    // Check permissions
    checkPermissions().then(setPermStatus);

    return () => {
      unsubStatus();
      unsubScan();
    };
  }, [open]);

  // Handle auto-print if requested and printer is ready
  useEffect(() => {
    if (open && autoPrintOnOpen && order && activePrinter && status !== "printing") {
      handlePrintReceipt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoPrintOnOpen]);

  const refreshPermissions = async () => {
    const status = await checkPermissions();
    setPermStatus(status);
    return status;
  };

  const handleRequestPermission = async () => {
    const res = await requestPermissions();
    setPermStatus(res);
    if (!res.bluetoothGranted) {
      await showPermissionNotification("bluetooth");
    }
  };

  const handleOpenSettings = async () => {
    await openSettingsPage();
  };

  const handleStartScan = async () => {
    setPrintError(null);
    try {
      // Ensure Bluetooth permission is actually granted (triggering the OS
      // system dialog on first use) before attempting to scan — scanning
      // directly without this would silently fail on Android 12+, which
      // requires BLUETOOTH_SCAN/BLUETOOTH_CONNECT to be granted at runtime.
      const permResult = await requestPermissions();
      setPermStatus(permResult);
      if (!permResult.bluetoothGranted) {
        setPrintError("Bluetooth permission is required to scan for printers.");
        await showPermissionNotification("bluetooth");
        return;
      }
      await printerService.startScan();
    } catch (err: any) {
      setPrintError(err?.message || "Failed to scan for Bluetooth printers");
      await refreshPermissions();
    }
  };

  const handleStopScan = async () => {
    await printerService.stopScan();
  };

  const handleSelectPrinter = async (printer: PrinterDevice) => {
    setPrintError(null);
    printerService.selectPrinter(printer, true);
    setSavedPrinters(printerService.getSavedPrinters());
    try {
      await printerService.connectPrinter(printer);
    } catch (err: any) {
      setPrintError(err?.message || "Failed to connect to printer");
    }
  };

  const handlePaperWidthChange = (width: PaperWidth) => {
    setPaperWidthState(width);
    printerService.setPaperWidth(width);
  };

  const handlePrintReceipt = async () => {
    if (!order) return;
    setPrintError(null);
    setIsPrinting(true);

    try {
      const result: PrintResult = await printerService.printReceipt(order, {
        paperWidth,
      });

      if (result.success) {
        onPrinted?.();
      } else {
        setPrintError(result.error || "Print failed. Please check printer power and paper.");
      }
    } catch (err: any) {
      setPrintError(err?.message || "Communication error during printing.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleTestPrint = async (printerOverride?: PrinterDevice) => {
    setPrintError(null);
    setIsTesting(true);

    try {
      const result: PrintResult = await printerService.testPrint(printerOverride);
      if (!result.success) {
        setPrintError(result.error || "Test print failed. Check printer connection.");
      }
    } catch (err: any) {
      setPrintError(err?.message || "Error running test print.");
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddWifiPrinter = () => {
    if (!wifiIp.trim()) {
      setPrintError("Please enter a valid IP address (e.g., 192.168.1.100)");
      return;
    }

    const portNum = parseInt(wifiPort, 10) || 9100;
    const added = printerService.addWifiPrinter(wifiName, wifiIp, portNum, paperWidth);
    setSavedPrinters(printerService.getSavedPrinters());
    setActivePrinter(added);
    setWifiIp("");
    setWifiName("");
    setPrintError(null);
  };

  const handleRemovePrinter = (id: string) => {
    printerService.removePrinter(id);
    setSavedPrinters(printerService.getSavedPrinters());
    setActivePrinter(printerService.getActivePrinter());
  };

  const isConnected = status === "connected" || status === "printing" || status === "printed";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={order ? "Print Kitchen Receipt" : "Thermal Printer Setup"}
    >
      <div className="flex flex-col gap-4 text-foreground max-h-[80vh] overflow-y-auto pr-1">
        {/* Permission Alert Banner */}
        {permStatus && !permStatus.bluetoothGranted && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-caption">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-amber-400 shrink-0 mt-0.5">
                bluetooth_disabled
              </span>
              <div className="flex-1">
                <h4 className="font-display font-bold text-amber-300">
                  Bluetooth Access Required
                </h4>
                <p className="mt-0.5 text-[12px] text-amber-200/80">
                  GRABIT needs Bluetooth permission to scan and connect to your thermal kitchen printer.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wider text-black hover:bg-amber-400"
                  >
                    Allow Bluetooth
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenSettings}
                    className="rounded-lg border border-amber-500/40 px-3 py-1.5 font-display text-[11px] font-bold text-amber-200 hover:bg-amber-500/20"
                  >
                    Open Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Printer Card */}
        <div className="rounded-2xl border border-border bg-surface-elevated p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isConnected
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : status === "connecting"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                      : "bg-surface-sunken text-muted border border-border"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {activePrinter?.type === "wifi" ? "wifi" : "print"}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-body-sm font-bold text-foreground truncate max-w-[180px]">
                    {activePrinter ? activePrinter.name : "No Printer Configured"}
                  </h3>
                  {activePrinter && (
                    <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted">
                      {activePrinter.type.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      isConnected
                        ? "bg-emerald-400"
                        : status === "connecting"
                          ? "bg-amber-400 animate-ping"
                          : "bg-muted"
                    }`}
                  />
                  <span className="text-muted font-medium">
                    {status === "connecting"
                      ? "Connecting to printer..."
                      : status === "printing"
                        ? "Sending print data..."
                        : status === "printed"
                          ? "Print successful ✓"
                          : isConnected
                            ? "Connected & Ready"
                            : "Disconnected"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Test / Reconnect button */}
            {activePrinter && (
              <button
                type="button"
                onClick={() => handleTestPrint()}
                disabled={isTesting || status === "printing"}
                className="rounded-xl border border-border bg-surface-sunken px-3 py-1.5 font-display text-caption font-bold text-muted hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50"
              >
                {isTesting ? "Testing..." : "Test Print"}
              </button>
            )}
          </div>

          {/* Paper Size Selector */}
          <div className="mt-3.5 pt-3.5 border-t border-border/50 flex items-center justify-between">
            <span className="font-display text-caption font-bold text-muted">
              Thermal Paper Width:
            </span>
            <div className="flex items-center gap-1.5 bg-surface-sunken p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => handlePaperWidthChange("58mm")}
                className={`px-3 py-1 rounded-lg text-caption font-bold transition-all ${
                  paperWidth === "58mm"
                    ? "bg-primary text-black shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                58mm (Small)
              </button>
              <button
                type="button"
                onClick={() => handlePaperWidthChange("80mm")}
                className={`px-3 py-1 rounded-lg text-caption font-bold transition-all ${
                  paperWidth === "80mm"
                    ? "bg-primary text-black shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                80mm (Standard)
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert with Retry */}
        {printError && (
          <div className="rounded-2xl border border-danger/40 bg-danger-soft/30 p-3.5 text-caption text-danger">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                  error
                </span>
                <div>
                  <span className="font-bold">Couldn&apos;t print receipt:</span>
                  <p className="mt-0.5 text-[12px] opacity-90">{printError}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {order && (
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="rounded-lg bg-danger px-2.5 py-1 text-[11px] font-bold text-white uppercase hover:opacity-90"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Primary Action Buttons if Order is provided */}
        {order && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handlePrintReceipt}
              disabled={isPrinting || !activePrinter}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-display text-body-sm font-extrabold uppercase tracking-wider text-on-primary shadow-glow-primary hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isPrinting ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    progress_activity
                  </span>
                  <span>Printing Receipt...</span>
                </>
              ) : status === "printed" ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>Printed Successfully ✓</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">print</span>
                  <span>PRINT KITCHEN RECEIPT ({paperWidth})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="h-10 rounded-xl border border-border bg-surface-sunken font-display text-caption font-bold text-muted hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              {showPreview ? "Hide Preview" : "Preview Kitchen Ticket"}
            </button>
          </div>
        )}

        {/* Live Thermal Receipt Preview */}
        {showPreview && order && (
          <div className="rounded-2xl border border-border/80 bg-background/80 p-3.5">
            <div className="mb-2 flex items-center justify-between text-caption font-bold text-muted">
              <span>Receipt Preview ({paperWidth})</span>
              <span className="font-mono text-[10px]">ESC/POS 203 DPI</span>
            </div>
            <div
              className={`mx-auto rounded-lg bg-[#f6f1e4] p-3 text-[11px] leading-tight text-[#191817] shadow-inner font-mono ${
                paperWidth === "80mm" ? "max-w-[320px]" : "max-w-[240px]"
              }`}
            >
              <div className="text-center font-bold text-[13px] tracking-widest">GRABIT</div>
              <div className="text-center font-bold text-[10px]">KITCHEN ORDER</div>
              <div className="my-1 text-center font-extrabold text-[14px]">ORDER #{order.id}</div>
              {order.vendorName && (
                <div className="text-center text-[10px] text-zinc-700">{order.vendorName}</div>
              )}
              <div className="my-1 border-b border-dashed border-zinc-400" />
              <div className="flex justify-between text-[10px]">
                <span>TYPE: {order.orderType}</span>
                <span>TIME: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {order.customerName && (
                <div className="text-[10px]">CUSTOMER: {order.customerName}</div>
              )}
              <div className="my-1 border-b border-dashed border-zinc-400" />

              <div className="flex flex-col gap-1.5 my-1.5">
                {order.items.map((it, idx) => (
                  <div key={idx}>
                    <div className="font-bold text-[11.5px]">
                      {it.quantity}x {it.name.toUpperCase()}
                    </div>
                    {it.variants?.map((v, vi) => (
                      <div key={vi} className="pl-2 text-[10px] text-zinc-700">+ {v}</div>
                    ))}
                    {it.specialInstructions && (
                      <div className="pl-2 text-[10px] font-semibold text-red-800">
                        NOTE: {it.specialInstructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {order.specialInstructions && (
                <>
                  <div className="my-1 border-b border-dashed border-zinc-400" />
                  <div className="font-bold text-[10px] text-red-800">
                    SPECIAL NOTE: {order.specialInstructions}
                  </div>
                </>
              )}

              <div className="my-1 border-b border-dashed border-zinc-400" />
              <div className="flex justify-between font-bold text-[10px]">
                <span>TOTAL ITEMS: {order.items.length}</span>
                <span>QTY: {order.items.reduce((s, it) => s + it.quantity, 0)}</span>
              </div>
              <div className="my-1 border-b border-dashed border-zinc-400" />
              <div className="text-center font-bold text-[11px]">STATUS: {order.status}</div>
              <div className="text-center text-[9px] text-zinc-600">--- KITCHEN COPY ---</div>
            </div>
          </div>
        )}

        {/* Printer Management Tabs */}
        <div className="mt-2 flex flex-col gap-3">
          <div className="flex items-center gap-1 border-b border-border pb-1">
            <button
              type="button"
              onClick={() => setActiveTab("bluetooth")}
              className={`flex items-center gap-1.5 px-3 py-2 font-display text-caption font-bold transition-colors border-b-2 ${
                activeTab === "bluetooth"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">bluetooth</span>
              Bluetooth Discovery
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("wifi")}
              className={`flex items-center gap-1.5 px-3 py-2 font-display text-caption font-bold transition-colors border-b-2 ${
                activeTab === "wifi"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">wifi</span>
              Wi-Fi / Network
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("saved")}
              className={`flex items-center gap-1.5 px-3 py-2 font-display text-caption font-bold transition-colors border-b-2 ${
                activeTab === "saved"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">devices</span>
              Saved ({savedPrinters.length})
            </button>
          </div>

          {/* TAB 1: Bluetooth Discovery */}
          {activeTab === "bluetooth" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-caption font-bold text-muted">
                  {isScanning ? "Searching for nearby printers..." : "Nearby Bluetooth Printers"}
                </span>

                <div className="flex items-center gap-2">
                  {isScanning ? (
                    <button
                      type="button"
                      onClick={handleStopScan}
                      className="rounded-xl border border-border px-3 py-1.5 font-display text-caption font-bold text-danger hover:bg-danger-soft/20"
                    >
                      Cancel Scan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartScan}
                      className="flex items-center gap-1.5 rounded-xl bg-primary/20 border border-primary/40 px-3 py-1.5 font-display text-caption font-bold text-primary hover:bg-primary/30"
                    >
                      <span className="material-symbols-outlined text-[16px]">radar</span>
                      Scan for Printers
                    </button>
                  )}
                </div>
              </div>

              {/* Scanning Indicator */}
              {isScanning && (
                <div className="flex items-center gap-2.5 rounded-xl bg-surface-sunken p-3 border border-border">
                  <span className="material-symbols-outlined text-[20px] text-primary animate-spin">
                    progress_activity
                  </span>
                  <span className="text-caption text-muted">
                    Scanning for ESC/POS Bluetooth printers... Make sure your printer is powered on and in range.
                  </span>
                </div>
              )}

              {/* Discovered & Bonded Devices List */}
              <div className="flex flex-col gap-2">
                {discoveredPrinters.length === 0 && !isScanning ? (
                  <div className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
                    <span className="material-symbols-outlined text-[32px] mb-1 opacity-50">
                      print_disabled
                    </span>
                    <p className="text-caption">No printers found yet.</p>
                    <p className="text-[11px] text-faint mt-0.5">
                      Pair your printer in Android Bluetooth Settings or tap &ldquo;Scan for Printers&rdquo;.
                    </p>
                  </div>
                ) : (
                  discoveredPrinters.map((dev) => {
                    const isSelected = activePrinter?.id === dev.id;
                    return (
                      <div
                        key={dev.id}
                        onClick={() => handleSelectPrinter(dev)}
                        className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-glow-primary"
                            : "border-border bg-surface-elevated hover:border-border/80"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`material-symbols-outlined text-[20px] ${
                              isSelected ? "text-primary" : "text-muted"
                            }`}
                          >
                            bluetooth
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-display text-body-sm font-bold text-foreground">
                                {dev.name}
                              </span>
                              {dev.bonded && (
                                <span className="rounded bg-white/10 px-1.5 py-0.2 text-[9px] font-medium text-muted">
                                  Paired
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-faint">{dev.address}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <span className="rounded-full bg-primary/20 text-primary px-2.5 py-0.5 text-[11px] font-bold">
                              Selected ✓
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPrinter(dev);
                            }}
                            className="rounded-lg border border-border px-3 py-1 font-display text-[11px] font-bold text-muted hover:text-foreground hover:border-primary/40"
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Wi-Fi / Network */}
          {activeTab === "wifi" && (
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-4">
              <h4 className="font-display text-caption font-bold uppercase tracking-wider text-muted">
                Add ESC/POS Network Printer
              </h4>
              <div className="flex flex-col gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-muted uppercase">Printer Name</label>
                  <input
                    type="text"
                    value={wifiName}
                    onChange={(e) => setWifiName(e.target.value)}
                    placeholder="Kitchen Counter Printer"
                    className="mt-1 w-full rounded-xl border border-border bg-surface-sunken p-2.5 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-muted uppercase">IP Address</label>
                    <input
                      type="text"
                      value={wifiIp}
                      onChange={(e) => setWifiIp(e.target.value)}
                      placeholder="192.168.1.100"
                      className="mt-1 w-full rounded-xl border border-border bg-surface-sunken p-2.5 font-mono text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-muted uppercase">Port</label>
                    <input
                      type="text"
                      value={wifiPort}
                      onChange={(e) => setWifiPort(e.target.value)}
                      placeholder="9100"
                      className="mt-1 w-full rounded-xl border border-border bg-surface-sunken p-2.5 font-mono text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddWifiPrinter}
                  className="mt-2 h-10 rounded-xl bg-primary font-display text-caption font-bold uppercase tracking-wider text-on-primary hover:opacity-90"
                >
                  Save & Connect Wi-Fi Printer
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Saved Printers */}
          {activeTab === "saved" && (
            <div className="flex flex-col gap-2">
              {savedPrinters.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
                  <p className="text-caption">No saved printers.</p>
                  <p className="text-[11px] text-faint mt-0.5">
                    Connect a Bluetooth or Wi-Fi printer to save it for one-tap printing.
                  </p>
                </div>
              ) : (
                savedPrinters.map((p) => {
                  const isDefault = activePrinter?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between rounded-xl border p-3 ${
                        isDefault
                          ? "border-primary/50 bg-primary/5"
                          : "border-border bg-surface-elevated"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px] text-muted">
                          {p.type === "wifi" ? "wifi" : "print"}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-body-sm font-bold text-foreground">
                              {p.name}
                            </span>
                            {isDefault && (
                              <span className="rounded bg-primary/20 text-primary px-1.5 py-0.2 text-[9px] font-bold">
                                Default
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-faint">
                            {p.address || (p.ip ? `${p.ip}:${p.port || 9100}` : p.id)} • {p.paperWidth}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSelectPrinter(p)}
                            className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-bold text-muted hover:text-foreground"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleTestPrint(p)}
                          className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-bold text-muted hover:text-foreground"
                        >
                          Test
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePrinter(p.id)}
                          className="rounded-lg p-1 text-muted hover:text-danger"
                          title="Remove printer"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end border-t border-border pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-5 py-2.5 font-display text-caption font-bold text-muted hover:text-foreground"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
