import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TechJest | Software Development Company",
    short_name: "TechJest",
    description: "Practical software development for startups and growing businesses.",
    start_url: getSiteUrl(),
    display: "browser",
    background_color: "#1b1e4a",
    theme_color: "#1b1e4a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
