"use client";

import { InstagramIcon } from "@/frontend/components/icons";

/**
 * Instagram spotlight component.
 * Directs visitors to the official TechJest Instagram profile with a clean,
 * accessible showcase that works across all devices without relying on third-party
 * iframes that get blocked by cross-origin policies.
 */
export const InstagramFeed = () => {
  return (
    <section className="section instagram-section" aria-label="TechJest on Instagram">
      <div className="container">
        <div
          style={{
            background: "linear-gradient(135deg, #1b1e4a 0%, #14163a 100%)",
            borderRadius: "16px",
            padding: "48px 36px",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            boxShadow: "0 14px 32px -16px rgba(27, 30, 74, 0.25)",
            border: "1px solid rgba(175, 174, 162, 0.2)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.1)",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              marginBottom: "16px",
              color: "#c9c8be",
            }}
          >
            <InstagramIcon />
            <span>@techjest_ on Instagram</span>
          </div>

          <h2
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 600,
              lineHeight: 1.2,
              margin: "0 0 16px 0",
              color: "#ffffff",
            }}
          >
            See how we build software in the open.
          </h2>

          <p
            style={{
              maxWidth: "560px",
              fontSize: "16px",
              lineHeight: 1.6,
              color: "#afaea2",
              margin: "0 0 28px 0",
            }}
          >
            Behind-the-scenes engineering, live product launches, tech breakdowns, and life at TechJest. Join our
            growing developer community.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              justifyContent: "center",
              marginBottom: "32px",
            }}
          >
            {["Web & App Architecture", "AI & Cloud Integrations", "Client Case Studies", "Team Insights"].map(
              (tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    fontSize: "13px",
                    color: "#efeee8",
                  }}
                >
                  {tag}
                </span>
              ),
            )}
          </div>

          <a
            href="https://www.instagram.com/techjest_/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 28px",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
            }}
            aria-label="Follow TechJest on Instagram"
          >
            <InstagramIcon />
            <span>Follow @techjest_</span>
          </a>
        </div>
      </div>
    </section>
  );
};
