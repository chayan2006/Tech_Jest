const base = "https://techjest.invalid";

// Only same-site paths are allowed after sign-in. Browsers treat "\" like "/" and drop
// tabs/newlines, so "/\evil.com" would otherwise leave the site.
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value))
    return fallback;
  try {
    const url = new URL(value, base);
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}
