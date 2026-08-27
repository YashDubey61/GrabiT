import type { CapacitorConfig } from "@capacitor/cli";

// GRABIT is a dynamic Next.js app (SSR, API routes, Supabase cookie
// sessions) — the Android shell points its WebView at the hosted site
// rather than bundling a static export, which would break all of that.
// Production default: https://grabit.ventures
// For local development: override with GRABIT_WEB_URL="http://localhost:3000"
const rawUrl = process.env.GRABIT_WEB_URL || "https://grabit.ventures";
const entryUrl = rawUrl.replace(/\/$/, "").endsWith("/customer")
  ? rawUrl.replace(/\/$/, "")
  : `${rawUrl.replace(/\/$/, "")}/customer`;

const config: CapacitorConfig = {
  appId: "app.grabit.student",
  appName: "GRABIT Student",
  webDir: "public",
  appendUserAgent: "CapacitorApp/GrabItStudent",
  server: {
    url: entryUrl,
    cleartext: entryUrl.startsWith("http://"),
  },
};

export default config;
