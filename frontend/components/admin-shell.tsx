import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  ["Overview", "/admin"],
  ["CRM", "/admin/crm"],
  ["Proposals", "/admin/proposals"],
  ["Projects", "/admin/projects"],
  ["Invoices", "/admin/invoices"],
  ["Requests", "/admin/requests"],
  ["People", "/admin/users"],
  ["Activity", "/admin/activity"],
] as const;

export function AdminShell({ children, email }: { children: ReactNode; email?: string }) {
  return <section className="section admin-section"><div className="container admin-layout">
    <aside className="admin-sidebar">
      <div className="eyebrow">TechJest control</div>
      <h2>Admin console</h2>
      <p>Manage leads, people, and website activity from one secure workspace.</p>
      <nav className="admin-nav" aria-label="Admin navigation">
        {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <div className="admin-sidebar-foot"><span>Signed in as</span><strong>{email ?? "Administrator"}</strong><Link href="/dashboard">View client site</Link></div>
    </aside>
    <main className="admin-content">{children}</main>
  </div></section>;
}
