import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthContext";
import "./globals.css";

// Single product sans per GRABIT_DESIGN.md — Inter, used for both display
// and body text (headings at 700, body at 400/500, buttons/labels at 600).
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GrabIt — Campus Canteen OS",
    template: "%s | GrabIt",
  },
  description: "When Hunger Hits, GrabIt. Pickup-first food ordering for Indian campuses.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Material Symbols is not distributed via next/font; loaded as a stylesheet
            deliberately, matching the icon system already used across the 17 locked
            Stitch screens. Restyled at controlled weight/size — never left at
            default per the "no stock icon packs at default weight" rule (PRD §12).

            ROOT CAUSE of the "raw icon name" refresh flicker (store, schedule,
            notifications, ...): every icon in the app is this one ligature font —
            className="material-symbols-outlined" spans literally contain the
            glyph name as text content, and the font-face turns that text into
            the icon glyph. With `display=swap`, the browser paints the fallback
            (a system font rendering that literal text) immediately and swaps to
            the icon glyphs only once this stylesheet's font finishes downloading
            — so on every refresh the raw ligature names are what actually paints
            first. `display=block` gives the icon font a short invisible period
            instead of painting fallback text, so nothing readable ever flashes;
            preload starts the fetch earlier so that invisible period is short
            even on a slow connection. This is a single global fix — every icon
            across Student/Vendor/Super Admin resolves through this one font.

            The `google-font-display` lint rule generically discourages
            `block` because for a *text* font it produces invisible-text
            flashes — but this is an icon ligature font, where the "fallback"
            swap paints instead is unreadable raw glyph names, strictly worse
            than a brief invisible icon. `block` is the deliberately correct
            choice here, not an oversight. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display -- App Router's root layout.tsx is the documented place for a shared stylesheet link; `block` is deliberate, see above. */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..600,0..1,-25..200&display=block"
          as="style"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display -- same rationale as the preload link above. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..600,0..1,-25..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

