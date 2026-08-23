"use client";

import { useEffect } from "react";

let lockCount = 0;
let previousOverflow = "";

/**
 * Locks body scroll while `isOpen` is true. Every modal in the Student
 * app is a `fixed inset-0` overlay with its own internal
 * `overflow-y-auto` panel — without this, the body underneath stays
 * scrollable, so a touch drag that starts inside the modal on Android
 * WebView can scroll the page behind it instead of (or in addition to)
 * the modal's own content. That's what produces the page appearing to
 * "jump" while a modal is open, and a background scroll position that's
 * changed by the time the modal closes.
 *
 * Reference-counted so two modals opening in sequence (or briefly
 * overlapping during a transition) don't have the first one's close
 * prematurely unlock the body while the second is still open.
 */
export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    if (lockCount === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [isOpen]);
}
