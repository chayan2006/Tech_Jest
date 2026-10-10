import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start a Software Project",
  description:
    "Tell TechJest what you are building and get a practical software project consultation for web, mobile, AI, cloud, design, or support work.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
