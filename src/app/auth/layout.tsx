import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Client login",
    description: "Sign in to the private TechJest client workspace.",
    path: "/auth",
  }),
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
