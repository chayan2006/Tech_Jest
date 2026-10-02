import { createClient } from "@/backend/supabase/server";

export const defaultSiteSettings = {
  homepage_eyebrow: "Independent technology partner",
  homepage_title: "Build software that moves your business forward.",
  homepage_description: "TechJest helps startups and growing teams turn good ideas into useful, dependable digital products.",
  homepage_cta: "Book a free consultation",
  contact_email: "techjest1@gmail.com",
  whatsapp_number: "919999999999",
} as const;

export async function getSiteSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key, value");
  return (data ?? []).reduce<Record<string, string>>((settings, item) => {
    settings[item.key] = item.value;
    return settings;
  }, { ...defaultSiteSettings });
}
