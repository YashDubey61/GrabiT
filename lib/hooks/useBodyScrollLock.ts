"use client";

import { useEffect, useRef } from "react";

/**
 * Active lock tokens, one per currently-open modal. A Set (rather than a
 * manually incremented/decremented counter) is idempotent: adding or
 * removing the same token twice — which a route change interrupting an
 * unmount, or a double-invoked effect, can genuinely cause — can never
 * desync the count. A previous counter-based version of this hook could
 * get permanently stuck above zero from exactly that kind of double
 * mount/unmount, leaving the ENTIRE app unscrollable (body
 * `overflow: hidden` forever, on every screen, not just while a modal
 * was open) until the WebView was killed and relaunched.
 */
const activeLocks = new Set<symbol>();
let previousOverflow = "";

/**
 * Locks body scroll while `isOpen` is true. Every modal in the Student
 * app is a `fixed inset-0` overlay with its own internal
 * `overflow-y-auto` panel — without this, the body underneath stays
 * scrollable, so a touch drag that starts inside the modal on Android
 * WebView can scroll the page behind it instead of (or in addition to)
 * the modal's own content.
 */
export function useBodyScrollLock(isOpen: boolean) {
  const token = useRef<symbol>(undefined);
  if (!token.current) token.current = Symbol("body-scroll-lock");

  useEffect(() => {
    if (typeof document === "undefined") return;
    const myToken = token.current!;

    if (!isOpen) {
      // Nothing to lock — but make sure this instance isn't holding a
      // stale lock from a previous `isOpen: true` render.
      if (activeLocks.delete(myToken) && activeLocks.size === 0) {
        document.body.style.overflow = previousOverflow;
      }
      return;
    }

    if (activeLocks.size === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    activeLocks.add(myToken);

    return () => {
      if (activeLocks.delete(myToken) && activeLocks.size === 0) {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [isOpen]);
}
