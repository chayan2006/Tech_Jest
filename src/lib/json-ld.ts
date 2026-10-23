// Structured data for a <script type="application/ld+json"> tag. JSON.stringify leaves "<" alone,
// so text such as "</script>" in an admin-edited service name would end the tag early.
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
