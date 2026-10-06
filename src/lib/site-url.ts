const defaultSiteUrl = "https://tech-jest-12.vercel.app";

// Pages that set their own openGraph replace the layout's, so they must repeat the image.
export const defaultOgImage = { url: "/images/techjest-brand.png", width: 1152, height: 768, alt: "TechJest software development company logo" };

export function getSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const siteUrl = configuredUrl || defaultSiteUrl;
  return siteUrl.replace(/\/+$/, "");
}
