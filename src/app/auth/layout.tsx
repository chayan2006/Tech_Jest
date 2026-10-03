import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client login",
  description: "Sign in to the private TechJest client workspace.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/auth" },
};

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
