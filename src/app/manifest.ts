import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TechJest | Software Development Company",
    short_name: "TechJest",
    description: "Practical software development for startups and growing businesses.",
    start_url: getSiteUrl(),
    display: "browser",
    background_color: "#0b0d12",
    theme_color: "#0b0d12",
    icons: [{ src: "/images/techjest-brand.png", sizes: "138x92", type: "image/png" }],
  };
}
