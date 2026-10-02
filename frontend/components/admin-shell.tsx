import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/backend/supabase/server";
import { MessageNotification } from "@/frontend/components/message-notification";

const links = [
  ["Overview", "/admin"],
  ["CRM", "/admin/crm"],
  ["Messages", "/admin/messages"],
  ["Proposals", "/admin/proposals"],
  ["Projects", "/admin/projects"],
  ["Invoices", "/admin/invoices"],
  ["Website settings", "/admin/settings"],
  ["Services", "/admin/services"],
  ["Requests", "/admin/requests"],
  ["People", "/admin/users"],
  ["Activity", "/admin/activity"],
] as const;

export async function AdminShell({ children, email }: { children: ReactNode; email?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <section className="section admin-section"><div className="container admin-layout">
    <aside className="admin-sidebar">
      <div className="eyebrow">TechJest control</div>
      <h2>Admin console</h2>
      <p>Manage leads, people, and website activity from one secure workspace.</p>
      <nav className="admin-nav" aria-label="Admin navigation">
        {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <div className="admin-sidebar-foot"><MessageNotification userId={user?.id ?? ""} admin /><span>Signed in as</span><strong>{email ?? "Administrator"}</strong><Link href="/dashboard">View client site</Link></div>
    </aside>
    <main className="admin-content">{children}</main>
  </div></section>;
}
