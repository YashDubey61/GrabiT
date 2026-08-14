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
  // Day 3: /admin was the Day 1/2 route name; the canonical Super Admin
  // dashboard is /superadmin. Kept as a redirect (not a route) so /admin
  // is never the real, canonical implementation — see app/superadmin/.
  async redirects() {
    return [
      { source: "/admin", destination: "/superadmin", permanent: false },
      {
        source: "/admin/:path*",
        destination: "/superadmin/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
