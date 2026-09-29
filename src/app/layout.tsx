import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import { MobileMenu } from "@/components/mobile-menu";
import { ProfileBadge } from "@/components/profile-badge";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "TechJest | Your Vision. Our Technology.", template: "%s | TechJest" },
  description: "Practical software engineering for startups and growing teams.",
};

const nav: readonly (readonly [string, string])[] = [["Services", "/services"], ["Work", "/portfolio"], ["About", "/about"], ["Contact", "/contact"], ["Login", "/auth"]];

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profileName = typeof user?.user_metadata?.full_name === "string"
    ? user.user_metadata.full_name
    : typeof user?.user_metadata?.name === "string" ? user.user_metadata.name : undefined;
  const avatarUrl = typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : undefined;
  return <html lang="en"><body>
    <a className="skip" href="#main">Skip to content</a>
    <header className="site-header"><div className="container nav">
      <div className="nav-left"><Link className="logo" href="/"><Image className="brand-image" src="/images/techjest-brand.png" alt="TechJest" width={138} height={92} priority /></Link>{user && <ProfileBadge email={user.email} name={profileName} avatarUrl={avatarUrl} />}</div>
      <nav className="nav-links" aria-label="Main navigation">{nav.filter(([, href]) => href !== "/auth" || !user).map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
      <div className="nav-actions"><Link className="btn btn-primary" href="/contact">Book a consultation</Link><MobileMenu /></div>
    </div></header>
    <main id="main">{children}</main>
    <footer className="footer"><div className="container">
      <div className="footer-grid"><div><Link className="logo" href="/"><Image className="brand-image footer-brand" src="/images/techjest-brand.png" alt="TechJest" width={138} height={92} /></Link><p>Practical technology for ambitious teams. Built with clarity, shipped with care.</p></div>
      <div><h4>Explore</h4><p><Link href="/services">Services</Link><br/><Link href="/portfolio">Our work</Link><br/><Link href="/about">About us</Link></p></div>
      <div><h4>Start a project</h4><p><Link href="/contact">Book a consultation</Link><br/><a href="mailto:techjest1@gmail.com">techjest1@gmail.com</a><br/><a href="https://wa.me/919999999999">WhatsApp</a></p></div>
      <div><h4>Principles</h4><p>Clear scope<br/>Useful software<br/>Long-term thinking</p></div></div>
      <div className="footer-bottom">© {new Date().getFullYear()} TechJest. Built for what’s next.</div>
    </div></footer>
    <a className="whatsapp" href="https://wa.me/919999999999?text=Hi%20TechJest%2C%20I%27d%20like%20to%20discuss%20a%20project." aria-label="Chat with us on WhatsApp">wa</a>
  </body></html>;
}
