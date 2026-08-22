import type { CapacitorConfig } from "@capacitor/cli";

// GRABIT is a dynamic Next.js app (SSR, API routes, Supabase cookie
// sessions) — the Android shell points its WebView at the hosted site
// rather than bundling a static export, which would break all of that.
// GRABIT_WEB_URL must be the real deployed origin for production builds;
// unset it (or point it at your `next dev` LAN address) for local dev.
const devUrl = process.env.GRABIT_WEB_URL;

const config: CapacitorConfig = {
  appId: "app.grabit.campus",
  appName: "GrabIt",
  webDir: "public",
  server: devUrl
    ? { url: devUrl, cleartext: devUrl.startsWith("http://") }
    : undefined,
};

export default config;
