import Link from "next/link";
import type { ReactNode } from "react";
import { AdminNav } from "@/frontend/components/admin-nav";
import { MessageNotification } from "@/frontend/components/message-notification";

// Pages pass the admin from requireAdmin(), so the shell needs no extra session lookup.
export function AdminShell({ children, user }: { children: ReactNode; user: { id: string; email?: string } }) {
  return (
    <section className="section admin-section">
      <div className="container admin-layout">
        <aside className="admin-sidebar">
          <div className="eyebrow">TechJest control</div>
          <h2>Admin console</h2>
          <p>Manage leads, people, and website activity from one secure workspace.</p>
          <AdminNav />
          <div className="admin-sidebar-foot">
            <MessageNotification userId={user.id} admin />
            <span>Signed in as</span>
            <strong>{user.email ?? "Administrator"}</strong>
            <Link href="/">View website</Link>
            <form action="/auth/signout" method="post">
              <button className="text-button admin-signout">Log out</button>
            </form>
          </div>
        </aside>
        {/* The site layout already provides the page's <main>. */}
        <div className="admin-content">{children}</div>
      </div>
    </section>
  );
}
