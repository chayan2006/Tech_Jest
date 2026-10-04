const defaultSiteUrl = "https://tech-jest-12.vercel.app";

export function getSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const siteUrl = configuredUrl || defaultSiteUrl;
  return siteUrl.replace(/\/+$/, "");
}
