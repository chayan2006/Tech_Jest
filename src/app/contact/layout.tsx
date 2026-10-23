import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = pageMetadata({
  title: "Contact Us: Get a Project Quote",
  description:
    "Get in touch with TechJest to discuss your web development, AI automation, mobile app, or digital product project. We reply within one business day.",
  path: "/contact",
});

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const siteUrl = getSiteUrl();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: "Start a software project with TechJest",
            url: `${siteUrl}/contact`,
            about: { "@id": `${siteUrl}/#organization` },
            isPartOf: { "@id": `${siteUrl}/#website` },
          }),
        }}
      />
      {children}
    </>
  );
}
