import { cache } from "react";
import { createClient } from "@/backend/supabase/server";

// Digits only, 10–15 long, and not a run like 919999999999 left over from a placeholder.
export function normalizeWhatsAppNumber(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 && !/(\d)\1{7,}/.test(digits) ? digits : "";
}

export function whatsappLink(number: string | null | undefined, text?: string) {
  const digits = normalizeWhatsAppNumber(number);
  if (!digits) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export const defaultSiteSettings = {
  homepage_eyebrow: "Independent technology partner",
  homepage_title: "Build software that moves your business forward.",
  homepage_description: "TechJest helps startups and growing teams turn good ideas into useful, dependable digital products.",
  homepage_cta: "Book a free consultation",
  contact_email: process.env.CONTACT_EMAIL?.trim() || "techjest1@gmail.com",
  whatsapp_number: normalizeWhatsAppNumber(process.env.WHATSAPP_NUMBER),
};

export type SiteSettings = typeof defaultSiteSettings;

// Cached per request: the layout and pages share one read.
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const settings: SiteSettings = { ...defaultSiteSettings };
  // No try/catch: cookies() must be allowed to signal dynamic rendering to Next.js,
  // and Supabase reports query failures through `error` rather than throwing.
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_settings").select("key, value");
  // A missing table (before the migration runs) silently falls back to the defaults.
  if (error && error.code !== "PGRST205" && error.code !== "42P01") console.error("Could not load site settings", { code: error.code, message: error.message });
  for (const item of data ?? []) {
    const value = typeof item.value === "string" ? item.value.trim() : "";
    if (value && item.key in settings) settings[item.key as keyof SiteSettings] = value;
  }
  return settings;
});
