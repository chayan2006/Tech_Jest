import type { Metadata } from "next";

// The shared link preview from app/opengraph-image.tsx.
const previewImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "TechJest, a software development company for growing businesses",
};

// Title, description, canonical URL and link-preview tags for one public page.
// Next merges metadata shallowly: a page without openGraph inherits the layout's (which points at the
// homepage), and a page with openGraph replaces it whole (losing the image). So every page sets all of it.
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
}: {
  title: string;
  description: string;
  path: string;
  // The homepage title already names TechJest, so it skips the "| TechJest" template.
  absoluteTitle?: boolean;
}): Metadata {
  const shareTitle = absoluteTitle ? title : `${title} | TechJest`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: "TechJest",
      title: shareTitle,
      description,
      url: path,
      images: [previewImage],
    },
    twitter: { card: "summary_large_image", title: shareTitle, description, images: [previewImage.url] },
  };
}
