"use client";

import { useEffect, useState, useCallback, useTransition, useRef } from "react";
import Image from "next/image";

interface OfflineOverlayProps {
  forceVisible?: boolean;
}

/**
 * Actively probe network connectivity across multiple layers:
 * 1. App server health check (HEAD /api/health)
 * 2. App server GET /api/health fallback
 * 3. Public DNS / CDN probe (Cloudflare trace) to confirm internet access
 */
async function probeNetwork(): Promise<boolean> {
  // Probe 1: App server HEAD /api/health
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`/api/health?t=${Date.now()}`, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok || res.status < 500) {
      return true;
    }
  } catch {
    // Fall through to probe 2
  }

  // Probe 2: App server GET /api/health
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`/api/health?t=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok || res.status < 500) {
      return true;
    }
  } catch {
    // Fall through to probe 3
  }

  // Probe 3: External public internet ping (mode: no-cors)
  // If the browser can reach Cloudflare's CDN trace without throwing a NetworkError,
  // the mobile device is definitely connected to the internet.
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    await fetch(`https://cloudflare.com/cdn-cgi/trace?t=${Date.now()}`, {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return true;
  } catch {
    // Genuinely offline
    return false;
  }
}

export function OfflineOverlay({ forceVisible = false }: OfflineOverlayProps) {
  const [isOffline, setIsOffline] = useState(forceVisible);
  const [isChecking, setIsChecking] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; icon: string } | null>(null);
  const [liked, setLiked] = useState(false);
  const [, startTransition] = useTransition();
  const offlineDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((text: string, icon = "📡") => {
    setToastMsg({ text, icon });
    setTimeout(() => {
      setToastMsg((cur) => (cur?.text === text ? null : cur));
    }, 3200);
  }, []);

  const checkConnectivity = useCallback(
    async (showUserFeedback = true) => {
      if (isChecking) return;
      if (showUserFeedback) setIsChecking(true);

      const isConnected = await probeNetwork();

      if (isConnected) {
        if (showUserFeedback) {
          showToast("Connection active! Resuming GrabIt...", "⚡");
        }
        startTransition(() => {
          setIsOffline(false);
          setIsChecking(false);
        });
      } else {
        if (showUserFeedback) {
          setIsChecking(false);
          showToast("Still offline. Check your network & signal.", "⚠️");
        }
        setIsOffline(true);
      }
    },
    [isChecking, showToast]
  );

  useEffect(() => {
    if (forceVisible) {
      setIsOffline(true);
      return;
    }

    if (typeof window === "undefined") return;

    // Handle offline event with a debounce & active probe so momentary Wi-Fi/LTE handovers don't block user
    const handleOffline = () => {
      if (offlineDebounceRef.current) clearTimeout(offlineDebounceRef.current);
      offlineDebounceRef.current = setTimeout(async () => {
        const stillConnected = await probeNetwork();
        if (!stillConnected) {
          setIsOffline(true);
        }
      }, 1500);
    };

    // Handle online event
    const handleOnline = () => {
      if (offlineDebounceRef.current) {
        clearTimeout(offlineDebounceRef.current);
        offlineDebounceRef.current = null;
      }
      showToast("Back online! Resuming GrabIt...", "🎉");
      setTimeout(() => {
        void checkConnectivity(false);
      }, 400);
    };

    // Auto-recheck when user returns to app/tab
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void checkConnectivity(false);
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    // Initial check on mount: If navigator claims offline, verify with a real probe before locking screen
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      probeNetwork().then((connected) => {
        if (!connected) {
          setIsOffline(true);
        }
      });
    }

    return () => {
      if (offlineDebounceRef.current) clearTimeout(offlineDebounceRef.current);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [checkConnectivity, forceVisible, showToast]);

  const handleNotify = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        showToast("You will be notified once connection returns!", "🔔");
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            showToast("Notification enabled for when you're back online!", "🔔");
          } else {
            showToast("We'll auto-reconnect once network returns!", "📡");
          }
        });
      } else {
        showToast("We'll auto-reconnect once network returns!", "📡");
      }
    } else {
      showToast("We'll auto-reconnect once network returns!", "📡");
    }
  };

  const toggleHeart = () => {
    setLiked((prev) => !prev);
    if (!liked) {
      showToast("Cravings saved! We'll show them on reconnect.", "❤️");
    }
  };

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#08080a] text-white overflow-y-auto px-4 py-6 selection:bg-[#ff6b00]/30"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 25%, rgba(255, 107, 0, 0.12) 0%, transparent 60%),
          radial-gradient(circle at 50% 85%, rgba(255, 107, 0, 0.05) 0%, transparent 50%)
        `,
      }}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100000] flex items-center gap-2 rounded-full border border-[#ff6b00]/40 bg-[#1a1a20]/95 px-4 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <span>{toastMsg.icon}</span>
          <span>{toastMsg.text}</span>
        </div>
      )}

      <main className="w-full max-w-[440px] min-h-[92dvh] flex flex-col items-center justify-between gap-4 py-4 text-center my-auto">
        {/* Header & Branding */}
        <header className="flex flex-col items-center gap-1.5 w-full">
          <div className="relative h-10 w-44">
            <Image
              src="/offline-logo-opt.png"
              alt="GrabIt"
              fill
              sizes="180px"
              priority
              className="object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
            />
          </div>
          <div className="flex items-center gap-2 text-[9.5px] font-extrabold tracking-[0.16em] uppercase text-zinc-400">
            <span className="text-[#ff6b00] font-black">—</span>
            <span>GOOD FOOD. ANYTIME. ANYWHERE.</span>
            <span className="text-[#ff6b00] font-black">—</span>
          </div>
        </header>

        {/* Mascot & Oops Sign */}
        <div className="relative w-full max-w-[320px] flex items-center justify-center my-[-4px]">
          <div className="relative w-full h-[220px]">
            <Image
              src="/offline-mascot-clean.png"
              alt="GrabIt Mascot Oops"
              fill
              sizes="320px"
              priority
              className="object-contain filter drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)] animate-pulse duration-1000"
            />
          </div>
        </div>

        {/* Main Message */}
        <section className="flex flex-col items-center gap-2 w-full">
          <h1 className="text-[28px] sm:text-[32px] font-black tracking-tight leading-tight uppercase">
            YOU&apos;RE <span className="text-[#ff6b00] drop-shadow-[0_0_20px_rgba(255,107,0,0.35)]">OFFLINE</span>
          </h1>
          <p className="text-[13.5px] leading-relaxed text-zinc-400 max-w-[290px] font-medium">
            Looks like we lost the connection.
            <br />
            Let&apos;s get you back online and <strong className="text-[#ff6b00] font-bold">GRABIT!</strong>
          </p>
        </section>

        {/* Connection Tips */}
        <section
          aria-label="Connection suggestions"
          className="w-full rounded-[18px] border border-dashed border-[#ff6b00]/35 bg-[#16161a]/75 p-3.5 backdrop-blur-md shadow-xl grid grid-cols-[1fr_auto_1fr] items-center gap-2.5"
        >
          <div className="flex items-center gap-2.5 text-left">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center text-[#ff6b00]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
              </svg>
            </div>
            <div className="text-[11px] font-semibold text-zinc-300 leading-snug">
              Check your
              <br />
              <strong>Wi-Fi or mobile data</strong>
            </div>
          </div>

          <div className="h-7 w-[1px] bg-white/10" aria-hidden="true" />

          <div className="flex items-center gap-2.5 text-left">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center text-[#ff6b00]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 20h2"></path>
                <path d="M7 20v-4"></path>
                <path d="M12 20v-8"></path>
                <path d="M17 20V8"></path>
                <path d="M22 20V4"></path>
              </svg>
            </div>
            <div className="text-[11px] font-semibold text-zinc-300 leading-snug">
              Move to a place
              <br />
              <strong>with better signal</strong>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="flex flex-col gap-2.5 w-full">
          <button
            type="button"
            onClick={() => checkConnectivity(true)}
            disabled={isChecking}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff7a00] to-[#ff5500] py-3.5 px-6 font-display text-[15px] font-extrabold text-black shadow-[0_4px_24px_rgba(255,107,0,0.35)] transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-75 cursor-pointer"
          >
            <svg
              className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
            <span>{isChecking ? "Checking Connection..." : "Retry Connection"}</span>
          </button>

          <button
            type="button"
            onClick={handleNotify}
            className="w-full flex items-center justify-center gap-2 rounded-full border-[1.5px] border-[#ff6b00] bg-transparent py-2.5 px-4 font-display text-[13px] font-bold text-[#ff6b00] transition-all hover:bg-[#ff6b00]/10 active:scale-[0.98] cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            <span>Notify me when I&apos;m back online</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOffline(false)}
            className="text-[12px] font-semibold text-zinc-400 hover:text-zinc-200 transition-colors py-1 cursor-pointer underline underline-offset-4"
          >
            Dismiss &amp; Continue to App
          </button>
        </section>

        {/* Bottom Food / Cravings Card */}
        <aside className="w-full rounded-[18px] border border-white/10 bg-[#16161a]/75 p-2.5 px-3.5 backdrop-blur-md shadow-lg flex items-center justify-between gap-3">
          <div className="relative h-11 w-11 shrink-0">
            <Image
              src="/offline-food-icon.png"
              alt="Cravings"
              fill
              sizes="48px"
              className="object-contain"
            />
          </div>
          <div className="flex-1 text-left flex flex-col gap-0.5">
            <div className="text-[12.5px] font-black uppercase">
              <span className="text-[#ff6b00] italic">CRAVINGS</span> DON&apos;T WAIT!
            </div>
            <div className="text-[10px] text-zinc-400 font-medium leading-tight">
              Tell us what you&apos;re craving.
              <br />
              We&apos;ll save it for you.
            </div>
          </div>
          <button
            type="button"
            onClick={toggleHeart}
            aria-label="Save cravings"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer ${
              liked
                ? "bg-[#ff3344]/20 text-[#ff3344] border-[#ff3344]/30 scale-105"
                : "bg-white/5 text-[#ff6b00] border-white/10 hover:bg-[#ff6b00]/15"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </aside>
      </main>
    </div>
  );
}
