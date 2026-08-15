import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GrabIt — Campus Canteen OS",
    short_name: "GrabIt",
    description: "When Hunger Hits, GrabIt. Pickup-first food ordering for Indian campuses.",
    start_url: "/student",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
