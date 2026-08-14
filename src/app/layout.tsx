import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GrabIt — Campus Canteen Pre-Order",
    template: "%s | GrabIt",
  },
  description:
    "Pre-order from your campus canteen. Skip the queue, grab your food.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GrabIt",
  },
};

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-dvh bg-bg text-text font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
