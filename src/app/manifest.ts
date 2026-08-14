import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GrabIt — Campus Canteen Pre-Order",
    short_name: "GrabIt",
    description:
      "Pre-order from your campus canteen. Skip the queue, grab your food.",
    start_url: "/app",
    display: "standalone",
    background_color: "#121212",
    theme_color: "#FF6D00",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
