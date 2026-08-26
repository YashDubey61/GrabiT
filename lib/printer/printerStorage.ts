import type { PaperWidth, PrinterDevice } from "./types";

const STORAGE_KEY_PRINTERS = "grabit_vendor_printers";
const STORAGE_KEY_DEFAULT_ID = "grabit_vendor_default_printer_id";
const STORAGE_KEY_PAPER_WIDTH = "grabit_vendor_paper_width";

export function loadSavedPrinters(): PrinterDevice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRINTERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn("[printerStorage] Failed to read saved printers:", err);
  }
  return [];
}

export function savePrinterToStorage(printer: PrinterDevice): PrinterDevice[] {
  if (typeof window === "undefined") return [];
  try {
    const current = loadSavedPrinters();
    const existingIndex = current.findIndex((p) => p.id === printer.id);
    let updated: PrinterDevice[];

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...printer };
    } else {
      // If this is the first printer, make it default automatically
      const isFirst = current.length === 0;
      updated = [...current, { ...printer, isDefault: printer.isDefault ?? isFirst }];
      if (isFirst) {
        setDefaultPrinterId(printer.id);
      }
    }

    localStorage.setItem(STORAGE_KEY_PRINTERS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("[printerStorage] Failed to save printer:", err);
    return loadSavedPrinters();
  }
}

export function removePrinterFromStorage(printerId: string): PrinterDevice[] {
  if (typeof window === "undefined") return [];
  try {
    const current = loadSavedPrinters();
    const updated = current.filter((p) => p.id !== printerId);
    localStorage.setItem(STORAGE_KEY_PRINTERS, JSON.stringify(updated));

    const defaultId = getDefaultPrinterId();
    if (defaultId === printerId) {
      if (updated.length > 0) {
        setDefaultPrinterId(updated[0].id);
      } else {
        localStorage.removeItem(STORAGE_KEY_DEFAULT_ID);
      }
    }

    return updated;
  } catch (err) {
    console.error("[printerStorage] Failed to remove printer:", err);
    return loadSavedPrinters();
  }
}

export function getDefaultPrinterId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY_DEFAULT_ID);
  } catch {
    return null;
  }
}

export function setDefaultPrinterId(printerId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_DEFAULT_ID, printerId);
    const printers = loadSavedPrinters().map((p) => ({
      ...p,
      isDefault: p.id === printerId,
    }));
    localStorage.setItem(STORAGE_KEY_PRINTERS, JSON.stringify(printers));
  } catch (err) {
    console.error("[printerStorage] Failed to set default printer:", err);
  }
}

export function getGlobalPaperWidth(): PaperWidth {
  if (typeof window === "undefined") return "58mm";
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PAPER_WIDTH);
    if (saved === "80mm" || saved === "58mm") return saved;
  } catch {}
  return "58mm";
}

export function setGlobalPaperWidth(width: PaperWidth): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PAPER_WIDTH, width);
  } catch (err) {
    console.error("[printerStorage] Failed to save paper width preference:", err);
  }
}
