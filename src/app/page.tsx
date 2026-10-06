import Link from "next/link";
import { LogoModel } from "@/frontend/components/logo-model";
import Image from "next/image";
import { getSiteSettings } from "@/backend/supabase/site-settings";
import type { Metadata } from "next";
import { defaultOgImage, getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "TechJest | Official Software Development Company",
  description: "TechJest is an Indian software development company building websites, web apps, mobile apps, AI/ML solutions, cloud infrastructure, and digital products for growing businesses.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "TechJest | Official Software Development Company",
    description: "TechJest builds practical websites, web apps, mobile apps, AI/ML solutions, and cloud infrastructure for growing businesses.",
    url: "/",
    images: [defaultOgImage],
  },
};

const services = [
  ["Web development", "web-development", "Marketing sites, web apps, and e-commerce that stay fast and maintainable."],
  ["Mobile app development", "mobile-app-development", "Cross-platform and native apps designed for real-world adoption."],
  ["AI / ML solutions", "ai-ml-solutions", "Useful automation, assistants, and forecasting grounded in your data."],
  ["Cloud & DevOps", "cloud-devops", "Reliable deployments, observability, and infrastructure that scales with you."],
  ["UI / UX design", "ui-ux-design", "Research-led interfaces that help people understand and act."],
  ["IT consulting & support", "it-consulting-support", "A practical technical partner for decisions, audits, and upkeep."],
];
const process = [
  ["01", "Understand", "We understand your business before writing code."],
  ["02", "Design", "We create the product architecture and UX."],
  ["03", "Build", "Agile development with regular client updates."],
  ["04", "Test", "QA, security, and performance testing."],
  ["05", "Deploy", "Production deployment and monitoring."],
  ["06", "Support", "Post-launch maintenance and improvements."],
];
const faqs = [["How much does a project cost?", "It depends on the scope and the outcome you need. We’ll give you a clear proposal after a short discovery call."], ["How quickly can we start?", "Most projects begin within one to three weeks of agreeing on scope and availability."], ["Who owns the code?", "You do. We hand over the source code, design files, and documentation created for your project."], ["How will we communicate?", "You’ll have a direct channel with the team, weekly demos, and a shared project board."], ["Can you work with our existing team?", "Yes. We can own a workstream, strengthen your team, or provide a second opinion."], ["What happens after launch?", "We can hand over fully, or stay on with a support retainer for fixes, improvements, and advice."]];

export default async function Home() { const settings = await getSiteSettings(); return <>
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  }) }} />
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${getSiteUrl()}/#webpage`,
    name: "TechJest | Official Software Development Company",
    url: getSiteUrl(),
    isPartOf: { "@id": `${getSiteUrl()}/#website` },
    about: { "@id": `${getSiteUrl()}/#organization` },
    description: "Official website of TechJest, an Indian software development company for growing businesses.",
    inLanguage: "en-IN",
  }) }} />
  <section className="hero"><div className="container hero-grid"><div><div className="eyebrow">{settings.homepage_eyebrow}</div><h1>{settings.homepage_title}</h1><p className="lead">{settings.homepage_description}</p><div className="hero-actions"><Link className="btn btn-primary" href="/contact">{settings.homepage_cta}</Link><Link className="btn btn-ghost" href="/portfolio">See our work</Link></div><div className="trust"><span className="dot"/> Replies within one business day</div></div><LogoModel /></div></section>
  <section className="section"><div className="container detail-grid"><div><div className="eyebrow">TechJest</div><h2>Software development for ambitious businesses.</h2></div><div><p className="lead">TechJest designs and builds websites, web applications, mobile apps, AI/ML solutions, cloud infrastructure, and user-focused digital products.</p><p>Founded and led by <strong>Chayan Khatua</strong> and <strong>Amit Shing Panwar</strong>, TechJest gives startups and growing teams a clear technical partner from the first idea through launch and ongoing improvement.</p><p><Link className="card-link" href="/about">Meet the founders and leadership team →</Link></p></div></div></section>
  <section className="section"><div className="container"><div className="section-head"><div><div className="eyebrow">What we do</div><h2>Technology with a job to do.</h2></div><p>From the first sketch to the systems that keep your product moving, we focus on outcomes over output.</p></div><div className="service-grid">{services.map(([title,slug,desc])=><article className="service-card" key={slug}><h3>{title}</h3><p>{desc}</p><Link className="card-link" href={`/services/${slug}`}>Explore service</Link></article>)}</div></div></section>
  <section className="section band"><div className="container"><div className="section-head"><div><div className="eyebrow">Why Tech Jest?</div><h2>A delivery process built for confidence.</h2></div><p className="lead">Every project moves through clear stages, from understanding the business to improving the product after launch.</p></div><div className="process-grid">{process.map(([num,title,desc])=><div className="process-step" key={num}><div className="step-no">{num} <span aria-hidden="true">—</span></div><h3>{title}</h3><p>{desc}</p></div>)}</div></div></section>
  <section className="section"><div className="container"><div className="section-head"><div><div className="eyebrow">Selected work</div><h2>Proof over promises.</h2></div><Link className="card-link" href="/portfolio">View all work</Link></div><div className="project-grid"><article className="project"><Image className="project-image" src="/images/StreamBirdIndia.png" alt="Stream Bird India homepage preview" width={2940} height={1596} /><div><div className="project-tag">Web development</div><h3>Stream Bird India</h3><p>A complete technology ecosystem website for a network connectivity and physical IT infrastructure company.</p></div><div><small>Stream Bird India</small><p><a className="card-link" href="https://stream-bird-india.vercel.app/" target="_blank" rel="noopener noreferrer">Visit live website ↗</a></p></div></article>{[["Operations dashboard","Confidential — logistics company","A clearer view of the work behind every delivery."],["Customer portal","Confidential — services company","A simpler way for customers to get things done."]].map(([title,client,desc])=><article className="project" key={title}><div><div className="project-tag">Sample project</div><h3>{title}</h3><p>{desc}</p></div><small>{client}</small></article>)}</div></div></section>
  <section className="section"><div className="container"><div className="section-head"><div><div className="eyebrow">Questions, answered</div><h2>Before we start.</h2></div><p>Open the questions that matter to your project. If you still need an answer, <Link className="card-link" href="/contact">start a conversation</Link>.</p></div><div className="faq-grid">{faqs.map(([q,a], index)=><details className="faq" key={q} open={index === 0}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></div></section>
  <section className="cta"><div className="container cta-row"><div><div className="eyebrow">Have a challenge in mind?</div><h2>Let’s make the next step clear.</h2></div><Link className="btn btn-primary" href="/contact">Start a conversation</Link></div></section>
</>; }
