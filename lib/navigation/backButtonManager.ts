import { useEffect, useRef } from "react";
import { App } from "@capacitor/app";
import { isNativePlatform } from "@/lib/capacitor/platform";

type ModalCloseHandler = () => void;

interface ModalStackEntry {
  id: string;
  close: ModalCloseHandler;
}

// Global LIFO stack for active modals, sheets, drawers, and overlays
const modalHandlerStack: ModalStackEntry[] = [];

// Exit confirmation dialog state and listeners
let isExitConfirmationOpen = false;
const exitConfirmationListeners = new Set<(isOpen: boolean) => void>();

export function isExitDialogVisible(): boolean {
  return isExitConfirmationOpen;
}

export function showExitConfirmation() {
  if (isExitConfirmationOpen) return;
  isExitConfirmationOpen = true;
  exitConfirmationListeners.forEach((fn) => fn(true));
}

export function hideExitConfirmation() {
  if (!isExitConfirmationOpen) return;
  isExitConfirmationOpen = false;
  exitConfirmationListeners.forEach((fn) => fn(false));
}

export function subscribeExitConfirmation(listener: (isOpen: boolean) => void): () => void {
  exitConfirmationListeners.add(listener);
  listener(isExitConfirmationOpen);
  return () => {
    exitConfirmationListeners.delete(listener);
  };
}

/**
 * Registers a modal close handler onto the top of the stack.
 * Returns an unregister function.
 */
export function registerModalBackHandler(id: string, close: ModalCloseHandler): () => void {
  // Remove any existing entry with same id
  const existingIdx = modalHandlerStack.findIndex((e) => e.id === id);
  if (existingIdx !== -1) {
    modalHandlerStack.splice(existingIdx, 1);
  }

  modalHandlerStack.push({ id, close });

  return () => {
    const idx = modalHandlerStack.findIndex((e) => e.id === id);
    if (idx !== -1) {
      modalHandlerStack.splice(idx, 1);
    }
  };
}

/**
 * React hook to automatically manage modal back-button priority.
 * When `isOpen` is true, the modal's `onClose` function is placed at the top of the stack.
 */
export function useModalBackHandler(isOpen: boolean, onClose: ModalCloseHandler, customId?: string) {
  const idRef = useRef(customId || `modal-${Math.random().toString(36).slice(2, 9)}`);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    const unregister = registerModalBackHandler(idRef.current, () => {
      onCloseRef.current();
    });

    return unregister;
  }, [isOpen]);
}

/**
 * Executes a clean, graceful application exit.
 * Releases camera/scanners and exits via Capacitor App plugin.
 */
export async function performAppExit(): Promise<void> {
  hideExitConfirmation();
  if (isNativePlatform()) {
    try {
      await App.exitApp();
    } catch (err) {
      console.warn("[backButtonManager] Error calling App.exitApp():", err);
    }
  }
}

/**
 * Central Android Hardware / Gesture Back Press Coordinator.
 * Evaluates the priority hierarchy:
 * 1. Top-most open modal/sheet -> Closes it
 * 2. Exit confirmation dialog open -> Dismisses it safely
 * 3. Inner page -> Navigates back within app
 * 4. Root Vendor screen -> Displays "Exit GRABIT Vendor?" confirmation
 */
export async function handleGlobalBackPress(options?: {
  canGoBack?: boolean;
  pathname?: string;
}): Promise<void> {
  // Priority 1: Check if any modal/sheet/drawer is open
  if (modalHandlerStack.length > 0) {
    const topEntry = modalHandlerStack.pop();
    if (topEntry) {
      try {
        topEntry.close();
      } catch (err) {
        console.warn("[backButtonManager] Error closing modal:", err);
      }
      return;
    }
  }

  // Priority 2: Check if exit confirmation dialog is already visible
  if (isExitConfirmationOpen) {
    hideExitConfirmation();
    return; // Dismiss dialog and remain in app
  }

  const currentPath = options?.pathname || (typeof window !== "undefined" ? window.location.pathname : "/");
  const canGoBack = options?.canGoBack ?? false;
  const isVendorArea = currentPath.startsWith("/vendor");

  // Priority 3: In-app navigation history exists -> go back within the app.
  // Gated on the WebView's own canGoBack signal rather than a route-string
  // match, since the vendor shell loads a remote production origin whose
  // exact pathname shape (proxies, trailing slashes, locale prefixes) can't
  // be assumed client-side. A stale/incorrect match here previously caused
  // real "back" history to be skipped straight to Priority 4/5.
  if (canGoBack && typeof window !== "undefined" && window.history.length > 1) {
    window.history.back();
    return;
  }

  // Priority 4: No history left within the vendor app -> exit confirmation.
  if (isVendorArea) {
    showExitConfirmation();
    return;
  }

  // Priority 5: Student / customer navigation or general routes -> minimize.
  if (isNativePlatform()) {
    try {
      await App.minimizeApp();
    } catch {
      // Ignore
    }
  }
}
