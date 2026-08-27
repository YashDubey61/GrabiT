"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";
import { handleGlobalBackPress } from "@/lib/navigation/backButtonManager";

// Native deep-link scheme registered in AndroidManifest.xml
// (scheme=app.grabit.student, host=auth, path=/callback). Matched by
// prefix, not a loose `includes("/auth/callback")`, so this never fires
// for in-app navigation to the web callback route.
const NATIVE_CALLBACK_PREFIX = "app.grabit.student://auth/callback";

// Guards against the callback being processed twice — appUrlOpen can fire
// for the same URL again on resume, and a cold start additionally goes
// through App.getLaunchUrl(). A code is single-use against Supabase, so a
// second exchangeCodeForSession() call would just fail, but this avoids
// the redundant network call and any redirect race.
let handledCallbackUrl: string | null = null;

async function handleOAuthCallback(url: string) {
  if (!url.startsWith(NATIVE_CALLBACK_PREFIX)) return;
  if (handledCallbackUrl === url) return;
  handledCallbackUrl = url;

  try {
    const parsedUrl = new URL(url);
    const code = parsedUrl.searchParams.get("code");
    const error = parsedUrl.searchParams.get("error");
    const errorDesc = parsedUrl.searchParams.get("error_description");

    // Best-effort: dismiss the Custom Tab opened by signInWithGoogle()
    // now that control is back with the app, regardless of outcome.
    import("@capacitor/browser")
      .then(({ Browser }) => Browser.close())
      .catch(() => {});

    if (error || errorDesc) {
      console.warn("[OAUTH NATIVE] OAuth callback returned error:", error || errorDesc);
      window.location.assign("/auth?error=Google+Sign-In+was+cancelled+or+failed.");
      return;
    }

    if (!code) return;

    const supabase = createClient();
    const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeErr) {
      console.error("[OAUTH NATIVE] Code exchange error:", exchangeErr);
      window.location.assign("/auth?error=Could+not+complete+Google+Sign-In.");
      return;
    }

    if (data.session) {
      console.log("[OAUTH NATIVE] Google Sign-In successful, redirecting to /customer");
      window.location.assign("/customer");
    }
  } catch (err) {
    console.error("[OAUTH NATIVE] Error parsing deep link URL:", err);
  }
}

export function CapacitorAppListener() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Handle Android hardware/gesture back button with full modal and navigation priority
    const backButtonListener = App.addListener("backButton", ({ canGoBack }) => {
      const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
      void handleGlobalBackPress({ canGoBack, pathname });
    });

    // Warm start / already-open app: OS delivers the deep link directly.
    const appUrlListener = App.addListener("appUrlOpen", ({ url }) => {
      if (url) void handleOAuthCallback(url);
    });

    // Cold start: the OAuth callback launched the app from a fully closed
    // state. appUrlOpen alone misses this — the launch URL has to be read
    // explicitly once on mount.
    App.getLaunchUrl().then((result) => {
      if (result?.url) void handleOAuthCallback(result.url);
    });

    return () => {
      backButtonListener.then((listener) => listener.remove());
      appUrlListener.then((listener) => listener.remove());
    };
  }, []);

  return null;
}
