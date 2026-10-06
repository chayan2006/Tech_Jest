import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { getServices } from "@/backend/supabase/services";
import { serviceAreas } from "@/frontend/data/service-areas";

// Reads the live catalog per request, like the /services pages.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const services = await getServices();
  const routes = [...new Set([
    "",
    "/services",
    ...serviceAreas.map((area) => `/services/${area.slug}`),
    ...services.map((service) => `/services/${service.slug}`),
    "/portfolio",
    "/about",
    "/contact",
  ])];
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
