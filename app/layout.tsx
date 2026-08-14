import type { Metadata, Viewport } from "next";
import { Montserrat, Sora } from "next/font/google";
import "./globals.css";

// Display face — Montserrat, used for headlines/titles only (PRD §12: Apple-level
// typographic restraint means the display face stays out of running text).
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

// Body face — Sora, used for running text, labels, and UI chrome.
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GrabIt — Campus Canteen OS",
    template: "%s | GrabIt",
  },
  description: "When Hunger Hits, GrabIt. Pickup-first food ordering for Indian campuses.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#121212",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${sora.variable}`}>
      <head>
        {/* Material Symbols is not distributed via next/font; loaded as a stylesheet
            deliberately, matching the icon system already used across the 17 locked
            Stitch screens. Restyled at controlled weight/size — never left at
            default per the "no stock icon packs at default weight" rule (PRD §12). */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- this
            rule targets Pages Router _document.js; App Router's root
            layout.tsx is the correct, documented place for a shared
            stylesheet link. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..600,0..1,-25..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
