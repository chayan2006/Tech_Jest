import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const routes = [
  "",
  "/services",
  "/services/web-development",
  "/services/mobile-app-development",
  "/services/ai-ml-solutions",
  "/services/cloud-devops",
  "/services/ui-ux-design",
  "/services/it-consulting-support",
  "/portfolio",
  "/about",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
