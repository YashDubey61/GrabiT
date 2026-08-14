import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Same image host the approved Stitch exports already reference
    // (grabit_campus_home_premium_black/code.html,
    // grabit_menu_premium_black/code.html) — reusing the exact source
    // imagery rather than substituting stock photos.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/aida-public/**",
      },
    ],
  },
};

export default nextConfig;
