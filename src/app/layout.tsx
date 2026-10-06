import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import { MobileMenu } from "@/frontend/components/mobile-menu";
import { ProfileBadge } from "@/frontend/components/profile-badge";
import { createClient } from "@/backend/supabase/server";
import { CartLink } from "@/frontend/components/service-cart";
import { MessageNotification } from "@/frontend/components/message-notification";
import { defaultOgImage, getSiteUrl } from "@/lib/site-url";
import { getSiteSettings, whatsappLink } from "@/backend/supabase/site-settings";

const siteUrl = getSiteUrl();
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "TechJest | Software Development Company for Growing Businesses", template: "%s | TechJest" },
  description: "TechJest is a software development company for startups and growing businesses. We build websites, web apps, mobile apps, AI/ML solutions, cloud infrastructure, and digital products.",
  keywords: ["TechJest", "software development company", "web development", "mobile app development", "AI ML solutions", "cloud DevOps", "UI UX design", "IT consulting"],
  applicationName: "TechJest",
  category: "Software development services",
  referrer: "origin-when-cross-origin",
  formatDetection: { email: false, address: false, telephone: false },
  authors: [
    { name: "Chayan Khatua", url: "https://github.com/chayan2006" },
    { name: "Amit Shing Panwar" },
  ],
  creator: "Chayan Khatua and Amit Shing Panwar",
  publisher: "TechJest",
  alternates: { canonical: "/" },
  icons: { icon: "/images/techjest-brand.png", apple: "/images/techjest-brand.png" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "TechJest",
    title: "TechJest | Software Development Company for Growing Businesses",
    description: "Practical software engineering for startups and growing teams, led by Founders and CEOs Chayan Khatua and Amit Shing Panwar.",
    url: "/",
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "TechJest | Software Development Company",
    description: "Web, mobile, AI, cloud, design, and IT consulting from TechJest.",
    images: ["/images/techjest-brand.png"],
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  other: {
    "ai-content-declaration": "This website contains original information about TechJest services, leadership, and work.",
    "ai-purpose": "Official company information, services, leadership, portfolio, and contact details for TechJest.",
  },
};

const nav: readonly (readonly [string, string])[] = [["Services", "/services"], ["Work", "/portfolio"], ["About", "/about"], ["Contact", "/contact"], ["Login", "/auth"]];

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profileName = typeof user?.user_metadata?.full_name === "string"
    ? user.user_metadata.full_name
    : typeof user?.user_metadata?.name === "string" ? user.user_metadata.name : undefined;
  const avatarUrl = typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : undefined;
  const isAdmin = user?.app_metadata?.role === "admin";
  const settings = await getSiteSettings();
  const contactEmail = settings.contact_email;
  const whatsappHref = whatsappLink(settings.whatsapp_number);
  const whatsappChatHref = whatsappLink(settings.whatsapp_number, "Hi TechJest, I'd like to discuss a project.");
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "TechJest",
    legalName: "TechJest",
    url: siteUrl,
    logo: `${siteUrl}/images/techjest-brand.png`,
    image: `${siteUrl}/images/techjest-brand.png`,
    email: contactEmail,
    description: "TechJest is a software development company that builds websites, web applications, mobile apps, AI/ML solutions, cloud infrastructure, and user-focused digital products for startups and growing businesses.",
    slogan: "Practical technology for ambitious teams.",
    brand: { "@type": "Brand", name: "TechJest", logo: `${siteUrl}/images/techjest-brand.png` },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: contactEmail,
      availableLanguage: ["English"],
    },
    founder: [
      { "@type": "Person", "@id": `${siteUrl}/about#chayan-khatua`, name: "Chayan Khatua", url: "https://github.com/chayan2006" },
      { "@type": "Person", "@id": `${siteUrl}/about#amit-shing-panwar`, name: "Amit Shing Panwar" },
    ],
    employee: [
      { "@type": "Person", "@id": `${siteUrl}/about#chayan-khatua`, name: "Chayan Khatua", jobTitle: "Founder / CEO" },
      { "@type": "Person", "@id": `${siteUrl}/about#amit-shing-panwar`, name: "Amit Shing Panwar", jobTitle: "Founder / CEO" },
      { "@type": "Person", "@id": `${siteUrl}/about#arushi-choudhary`, name: "Arushi Choudhary", jobTitle: "CTO" },
      { "@type": "Person", "@id": `${siteUrl}/about#sindhant-dadwal`, name: "Sindhant Dadwal", jobTitle: "CFO" },
      { "@type": "Person", "@id": `${siteUrl}/about#nishtha-banerjee`, name: "Nishtha Banerjee", jobTitle: "CPO" },
      { "@type": "Person", "@id": `${siteUrl}/about#nayan-roy`, name: "Nayan Roy", jobTitle: "CMO" },
    ],
    sameAs: ["https://github.com/chayan2006/Tech_Jest"],
    areaServed: [
      { "@type": "Country", name: "India" },
      { "@type": "Place", name: "Worldwide" },
    ],
    knowsLanguage: "English",
    knowsAbout: ["Web development", "Mobile app development", "Artificial intelligence", "Machine learning", "Cloud computing", "DevOps", "UI/UX design", "IT consulting"],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "TechJest software development services",
      itemListElement: ["Web development", "Mobile app development", "AI / ML solutions", "Cloud & DevOps", "UI / UX design", "IT consulting & support"].map((name, index) => ({
        "@type": "Offer",
        position: index + 1,
        itemOffered: { "@type": "Service", name, provider: { "@id": `${siteUrl}/#organization` } },
      })),
    },
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TechJest",
    url: siteUrl,
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage: "en-IN",
    description: "Official website of TechJest, led by Founders and CEOs Chayan Khatua and Amit Shing Panwar.",
    about: { "@id": `${siteUrl}/#organization` },
    keywords: "software development, web development, mobile apps, AI, cloud, DevOps, UI/UX design, IT consulting",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/services?query={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  return <html lang="en"><body>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
    <a className="skip" href="#main">Skip to content</a>
    <header className="site-header"><div className="container nav">
      <div className="nav-left"><Link className="logo" href="/"><Image className="brand-image" src="/images/techjest-brand.png" alt="TechJest" width={138} height={92} /></Link>{user && <ProfileBadge email={user.email} name={profileName} avatarUrl={avatarUrl} />}</div>
      <nav className="nav-links" aria-label="Main navigation">{nav.filter(([, href]) => href !== "/auth" || !user).map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
      <div className="nav-actions">{user && <MessageNotification userId={user.id} admin={isAdmin} />}<CartLink /><Link className="btn btn-primary" href="/contact">Book a consultation</Link><MobileMenu signedIn={Boolean(user)} admin={isAdmin} /></div>
    </div></header>
    <main id="main">{children}</main>
    <footer className="footer"><div className="container">
      <div className="footer-grid"><div><Link className="logo" href="/"><Image className="brand-image footer-brand" src="/images/techjest-brand.png" alt="TechJest" width={138} height={92} /></Link><p>Practical technology for ambitious teams. Built with clarity, shipped with care.</p></div>
      <div><h4>Explore</h4><p><Link href="/services">Services</Link><br/><Link href="/portfolio">Our work</Link><br/><Link href="/about">About us</Link></p></div>
      <div><h4>Start a project</h4><p><Link href="/contact">Book a consultation</Link><br/><a href={`mailto:${contactEmail}`}>{contactEmail}</a>{whatsappHref && <><br/><a href={whatsappHref}>WhatsApp</a></>}</p></div>
      <div><h4>Principles</h4><p>Clear scope<br/>Useful software<br/>Long-term thinking</p></div></div>
      <div className="footer-bottom">© {new Date().getFullYear()} TechJest. Built for what’s next.</div>
    </div></footer>
    {whatsappChatHref && <a className="whatsapp" href={whatsappChatHref} aria-label="Chat with us on WhatsApp">wa</a>}
  </body></html>;
}
