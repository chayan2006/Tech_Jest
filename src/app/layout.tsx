import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Image from "next/image";
import { Manrope, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { MobileMenu } from "@/frontend/components/mobile-menu";
import { NavLinks } from "@/frontend/components/nav-links";
import { SiteIntro, introScript } from "@/frontend/components/site-intro";
import { ChatIcon } from "@/frontend/components/icons";
import { team, type TeamMember } from "@/frontend/data/team";
import { ProfileBadge } from "@/frontend/components/profile-badge";
import { createClient } from "@/backend/supabase/server";
import { CartLink } from "@/frontend/components/service-cart";
import { MessageNotification } from "@/frontend/components/message-notification";
import { getSiteUrl } from "@/lib/site-url";
import { getSiteSettings, whatsappLink } from "@/backend/supabase/site-settings";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });
// Headings only use the 600 weight, so one static file keeps the download small.
const serif = Source_Serif_4({ subsets: ["latin"], weight: "600", variable: "--font-serif" });

const siteUrl = getSiteUrl();
const founders = team.filter((member) => member.founder);
// One identity per person, linked to the matching card on /about and their public profiles.
const person = (member: TeamMember) => ({
  "@type": "Person",
  "@id": `${siteUrl}/about#${member.id}`,
  name: member.name,
  ...(member.photo ? { image: `${siteUrl}${member.photo}` } : {}),
  sameAs: member.github ? [member.linkedin, member.github] : [member.linkedin],
});
export const viewport: Viewport = { themeColor: "#1b1e4a" };
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "TechJest | Software Development Company for Growing Businesses", template: "%s | TechJest" },
  description:
    "TechJest is a software development company for startups and growing businesses. We build websites, web apps, mobile apps, AI/ML solutions, cloud infrastructure, and digital products.",
  keywords: [
    "TechJest",
    "software development company",
    "web development",
    "mobile app development",
    "AI ML solutions",
    "cloud DevOps",
    "UI UX design",
    "IT consulting",
  ],
  applicationName: "TechJest",
  category: "Software development services",
  referrer: "origin-when-cross-origin",
  formatDetection: { email: false, address: false, telephone: false },
  authors: founders.map((member) => ({ name: member.name, url: member.linkedin })),
  creator: "Chayan Khatua and Amit Singh Panwar",
  publisher: "TechJest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "TechJest",
    title: "TechJest | Software Development Company for Growing Businesses",
    description:
      "Practical software engineering for startups and growing teams, led by Founders and CEOs Chayan Khatua and Amit Singh Panwar.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "TechJest | Software Development Company",
    description: "Web, mobile, AI, cloud, design, and IT consulting from TechJest.",
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
    "ai-content-declaration":
      "This website contains original information about TechJest services, leadership, and work.",
    "ai-purpose": "Official company information, services, leadership, portfolio, and contact details for TechJest.",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  // The session check and the public settings read are independent, so run them together.
  const [
    {
      data: { user },
    },
    settings,
  ] = await Promise.all([supabase.auth.getUser(), getSiteSettings()]);
  const profileName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user?.user_metadata?.name === "string"
        ? user.user_metadata.name
        : undefined;
  const avatarUrl = typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : undefined;
  const isAdmin = user?.app_metadata?.role === "admin";
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
    description:
      "TechJest is a software development company that builds websites, web applications, mobile apps, AI/ML solutions, cloud infrastructure, and user-focused digital products for startups and growing businesses.",
    slogan: "Practical technology for ambitious teams.",
    brand: { "@type": "Brand", name: "TechJest", logo: `${siteUrl}/images/techjest-brand.png` },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: contactEmail,
      availableLanguage: ["English"],
    },
    founder: founders.map(person),
    employee: team.map((member) => ({ ...person(member), jobTitle: member.role })),
    sameAs: ["https://github.com/chayan2006/Tech_Jest"],
    areaServed: [
      { "@type": "Country", name: "India" },
      { "@type": "Place", name: "Worldwide" },
    ],
    knowsLanguage: "English",
    knowsAbout: [
      "Web development",
      "Mobile app development",
      "Artificial intelligence",
      "Machine learning",
      "Cloud computing",
      "DevOps",
      "UI/UX design",
      "IT consulting",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "TechJest software development services",
      itemListElement: [
        "Web development",
        "Mobile app development",
        "AI / ML solutions",
        "Cloud & DevOps",
        "UI / UX design",
        "IT consulting & support",
      ].map((name, index) => ({
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
    description: "Official website of TechJest, led by Founders and CEOs Chayan Khatua and Amit Singh Panwar.",
    about: { "@id": `${siteUrl}/#organization` },
    keywords: "software development, web development, mobile apps, AI, cloud, DevOps, UI/UX design, IT consulting",
  };
  // The intro script sets data-intro on <html> before hydration, hence suppressHydrationWarning.
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <SiteIntro />
        <a className="skip" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <div className="container nav">
            <div className="nav-left">
              <Link className="logo" href="/">
                <Image
                  className="brand-image"
                  src="/images/techjest-brand.png"
                  alt="TechJest"
                  width={138}
                  height={92}
                />
              </Link>
              {user && <ProfileBadge email={user.email} name={profileName} avatarUrl={avatarUrl} admin={isAdmin} />}
            </div>
            <NavLinks signedIn={Boolean(user)} />
            <div className="nav-actions">
              {user && <MessageNotification userId={user.id} admin={isAdmin} />}
              <CartLink />
              <Link className="btn btn-primary" href="/contact">
                Book a consultation
              </Link>
              <MobileMenu signedIn={Boolean(user)} admin={isAdmin} />
            </div>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="footer">
          <div className="container">
            <div className="footer-grid">
              <div>
                <Link className="logo" href="/">
                  <Image
                    className="brand-image footer-brand"
                    src="/images/techjest-brand.png"
                    alt="TechJest"
                    width={138}
                    height={92}
                  />
                </Link>
                <p>Practical technology for ambitious teams. Built with clarity, shipped with care.</p>
              </div>
              <div>
                <h2>Explore</h2>
                <p>
                  <Link href="/services">Services</Link>
                  <br />
                  <Link href="/portfolio">Our work</Link>
                  <br />
                  <Link href="/about">About us</Link>
                  <br />
                  <Link href="/privacy">Privacy policy</Link>
                  <br />
                  <Link href="/terms">Terms of service</Link>
                </p>
              </div>
              <div>
                <h2>Start a project</h2>
                <p>
                  <Link href="/contact">Book a consultation</Link>
                  <br />
                  <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                  {whatsappHref && (
                    <>
                      <br />
                      <a href={whatsappHref}>WhatsApp</a>
                    </>
                  )}
                </p>
              </div>
              <div>
                <h2>Principles</h2>
                <p>
                  Clear scope
                  <br />
                  Useful software
                  <br />
                  Long-term thinking
                </p>
              </div>
            </div>
            <div className="footer-bottom">© {new Date().getFullYear()} TechJest. Built for what’s next.</div>
          </div>
        </footer>
        {/* A labelled landmark, so screen-reader users can find the floating chat button. */}
        {whatsappChatHref && (
          <aside aria-label="WhatsApp chat">
            <a className="whatsapp" href={whatsappChatHref} aria-label="Chat with us on WhatsApp">
              <ChatIcon />
            </a>
          </aside>
        )}
      </body>
    </html>
  );
}
