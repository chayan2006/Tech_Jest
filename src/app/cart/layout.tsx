import type { Metadata } from "next";

// The cart is personal state, not content, so keep it out of search results.
export const metadata: Metadata = {
  title: "Project cart",
  robots: { index: false, follow: false },
};

export default function CartLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
