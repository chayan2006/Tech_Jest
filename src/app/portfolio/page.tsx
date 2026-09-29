import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Work | Stream Bird India Website",
  description: "See how TechJest built the Stream Bird India company homepage and technology ecosystem website.",
  alternates: { canonical: "/portfolio" },
};

export default function Portfolio(){return <><section className="page-hero"><div className="container"><div className="eyebrow">Selected work</div><h1>Stream Bird India</h1><p className="lead">The Stream Bird India homepage, presented as a live company website project.</p></div></section><section className="section"><div className="container"><article className="project project-featured"><div className="project-preview"><Image className="project-image" src="/images/StreamBirdIndia.png" alt="Stream Bird India homepage shown in the TechJest work portfolio" width={2940} height={1596} /></div><div className="project-details"><div className="project-tag">Company homepage / Web development</div><h2>Complete technology ecosystem.</h2><p>A public-facing homepage for Stream Bird India, a technology ecosystem focused on network connectivity and physical IT infrastructure.</p><dl className="project-facts"><div><dt>Project</dt><dd>Company homepage</dd></div><div><dt>Focus</dt><dd>Technology ecosystem</dd></div><div><dt>Visit</dt><dd>Live website</dd></div></dl><p><a className="btn btn-primary" href="https://stream-bird-india.vercel.app/" target="_blank" rel="noopener noreferrer">Open Stream Bird India ↗</a></p></div></article></div></section></>}
