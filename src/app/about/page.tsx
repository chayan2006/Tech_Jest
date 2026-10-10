import type { Metadata } from "next";
import Image from "next/image";
import { getSiteUrl } from "@/lib/site-url";
import { team } from "@/frontend/data/team";
import { LinkedInIcon } from "@/frontend/components/icons";

export const metadata: Metadata = {
  title: "About TechJest and Our Founders",
  description:
    "Meet the TechJest team: Founders and CEOs Chayan Khatua and Amit Singh Panwar, CTO Arushi Choudhary, CFO Sindhant Dadwal, CPO Nishtha Banerjee, CMO Nayan Roy, and Chitwandeep Kaur.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "About TechJest",
            description: "Learn about TechJest, its leadership team, and its approach to practical software delivery.",
            mainEntity: { "@type": "Organization", "@id": `${getSiteUrl()}/#organization` },
          }),
        }}
      />
      <section className="page-hero">
        <div className="container">
          <div className="eyebrow">About TechJest</div>
          <h1>Good technology should make work feel lighter.</h1>
          <p className="lead">
            TechJest is a software development company led by Founders and CEOs Chayan Khatua and Amit Singh Panwar. We
            build practical digital products for startups and growing businesses.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container detail-grid">
          <div>
            <div className="eyebrow">Leadership &amp; team</div>
            <h2>People building the next chapter of TechJest.</h2>
          </div>
          <div>
            <p className="lead">
              Our leadership team combines product, technology, finance, operations, and marketing expertise to help
              teams turn strong ideas into useful, dependable digital products.
            </p>
            <div className="process-grid leadership-grid">
              {team.map((member) => (
                <div className="process-step leader-card" id={member.id} key={member.id}>
                  {member.photo ? (
                    <Image className="leader-photo" src={member.photo} alt="" width={80} height={80} />
                  ) : (
                    <span className="leader-photo leader-initials" aria-hidden="true">
                      {member.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                  )}
                  <div>
                    <h3>{member.name}</h3>
                    <p>{member.role}</p>
                    <a
                      className="profile-link"
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${member.name} on LinkedIn`}
                    >
                      <LinkedInIcon /> LinkedIn
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="section band">
        <div className="container">
          <div className="eyebrow">How we work</div>
          <h2>Values with a behavior attached.</h2>
          <div className="process-grid">
            <div className="process-step">
              <h3>Clarity</h3>
              <p>We write down the decision, the trade-off, and the next step.</p>
            </div>
            <div className="process-step">
              <h3>Useful over impressive</h3>
              <p>We measure progress by what users can do, not by how complex the system sounds.</p>
            </div>
            <div className="process-step">
              <h3>Ownership</h3>
              <p>You receive the knowledge, files, and code needed to keep moving.</p>
            </div>
            <div className="process-step">
              <h3>Care</h3>
              <p>We test the edges, communicate early, and leave things better documented.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
