import { createClient } from "@/backend/supabase/server";
import { services as fallbackServices } from "@/frontend/data/services";
import type { Service } from "@/frontend/data/services";

function fromRow(row: Record<string, unknown>): Service {
  return {
    slug: String(row.slug),
    name: String(row.name),
    category: String(row.category) as Service["category"],
    description: String(row.description),
    price: typeof row.price === "number" ? row.price : null,
    delivery: String(row.delivery),
    icon: String(row.icon ?? "✦"),
    popular: Boolean(row.popular),
    included: Array.isArray(row.included) ? row.included.filter(item => typeof item === "string") : [],
    technologies: Array.isArray(row.technologies) ? row.technologies.filter(item => typeof item === "string") : [],
  };
}

export async function getServices(options: { fallbackOnMissingTable?: boolean } = {}): Promise<Service[]> {
  const fallbackOnMissingTable = options.fallbackOnMissingTable ?? true;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("service_catalog")
      .select("slug, name, category, description, price, delivery, icon, popular, included, technologies")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (!error) return (data ?? []).map(row => fromRow(row as Record<string, unknown>));
    if (error.code === "42P01" || error.code === "PGRST205") {
      return fallbackOnMissingTable ? fallbackServices : [];
    }
    console.error("Could not load the service catalog", { code: error.code, message: error.message });
    return [];
  } catch (error) {
    console.error("Could not connect to the service catalog", error);
    return fallbackOnMissingTable ? fallbackServices : [];
  }
}

export { fallbackServices };
