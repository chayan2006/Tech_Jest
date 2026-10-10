import Link from "next/link";
import { requireAdmin } from "@/backend/supabase/admin";
import { AdminShell } from "@/frontend/components/admin-shell";
import { AdminSiteSettings } from "@/frontend/components/admin-site-settings";
import { defaultSiteSettings } from "@/backend/supabase/site-settings";

const labels = [
  ["homepage_eyebrow", "Homepage eyebrow", "Small label above the homepage hero."],
  ["homepage_title", "Homepage headline", "Main homepage hero heading."],
  ["homepage_description", "Homepage description", "Short supporting text below the headline."],
  ["homepage_cta", "Homepage primary CTA", "Text for the main hero button."],
  ["contact_email", "Contact email", "Displayed in the footer, contact page, and search results."],
  [
    "whatsapp_number",
    "WhatsApp number",
    "Mobile number, e.g. 9876543210 (India) or with country code, e.g. 919876543210. Leave empty to hide all WhatsApp links.",
  ],
] as const;

export default async function AdminSettingsPage() {
  const { supabase, user } = await requireAdmin();
  const { data, error } = await supabase.from("site_settings").select("key, value");
  const values = new Map((data ?? []).map((item) => [item.key, item.value]));
  const settings = labels.map(([key, label, description]) => ({
    key,
    label,
    description,
    value: values.get(key) ?? defaultSiteSettings[key],
  }));
  return (
    <AdminShell user={user}>
      <div className="admin-title">
        <div>
          <div className="eyebrow">Website control</div>
          <h1>Site settings.</h1>
          <p className="lead">Update the core homepage and contact details without editing source code.</p>
        </div>
        <Link className="btn btn-ghost" href="/">
          View website
        </Link>
      </div>
      {error ? (
        <div className="empty-state">
          <h2>Settings unavailable.</h2>
          <p>
            The site_settings table is missing. Run backend/supabase/migrations/2026-10-07-fix-site-audit-issues.sql in
            the Supabase SQL Editor, then reload this page.
          </p>
        </div>
      ) : (
        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Public website content</h2>
              <p>Changes are saved to Supabase and appear across the website after refresh.</p>
            </div>
          </div>
          <AdminSiteSettings settings={settings} />
        </div>
      )}
    </AdminShell>
  );
}
