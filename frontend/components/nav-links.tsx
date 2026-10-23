"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "@/frontend/components/account";

const links: readonly (readonly [string, string])[] = [
  ["Services", "/services"],
  ["Work", "/portfolio"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Login", "/auth"],
];

export function NavLinks() {
  const pathname = usePathname();
  const signedIn = Boolean(useAccount().account);
  return (
    <nav className="nav-links" aria-label="Main navigation">
      {links
        .filter(([, href]) => href !== "/auth" || !signedIn)
        .map(([label, href]) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
    </nav>
  );
}
