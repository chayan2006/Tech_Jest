"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Day-to-day work first, then website setup.
const links = [
  ["Overview", "/admin"],
  ["Notifications", "/admin/notifications"],
  ["Messages", "/admin/messages"],
  ["Requests", "/admin/requests"],
  ["CRM", "/admin/crm"],
  ["Proposals", "/admin/proposals"],
  ["Projects", "/admin/projects"],
  ["Invoices", "/admin/invoices"],
  ["People", "/admin/users"],
  ["Services", "/admin/services"],
  ["Website settings", "/admin/settings"],
  ["Activity", "/admin/activity"],
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="admin-nav" aria-label="Admin navigation">
      {links.map(([label, href]) => {
        const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
