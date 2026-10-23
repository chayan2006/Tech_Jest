import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { getServices } from "@/backend/supabase/services";
import { createPublicClient } from "@/backend/supabase/public";
import { serviceAreas } from "@/frontend/data/service-areas";

// Rebuilt with the /services pages: every 5 minutes, or straight after an admin edit.
export const revalidate = 300;

// Real edit dates from the catalog, so lastmod only changes when a service does.
async function getServiceDates(): Promise<Map<string, Date>> {
  const dates = new Map<string, Date>();
  try {
    const { data, error } = await createPublicClient()
      .from("service_catalog")
      .select("slug, updated_at")
      .eq("is_active", true);
    if (error) return dates;
    for (const row of data ?? []) {
      const date = new Date(String(row.updated_at));
      if (!Number.isNaN(date.getTime())) dates.set(String(row.slug), date);
    }
  } catch {
    // No dates is fine: lastmod is optional, and a wrong one is worse than none.
  }
  return dates;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const [services, serviceDates] = await Promise.all([getServices(), getServiceDates()]);
  const routes = [
    ...new Set([
      "",
      "/services",
      ...serviceAreas.map((area) => `/services/${area.slug}`),
      ...services.map((service) => `/services/${service.slug}`),
      "/portfolio",
      "/about",
      "/contact",
      "/privacy",
      "/terms",
    ]),
  ];
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: serviceDates.get(route.replace("/services/", "")),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
