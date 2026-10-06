import { createClient } from "@/backend/supabase/server";
import { getSiteSettings, whatsappLink } from "@/backend/supabase/site-settings";
import { ContactForm } from "@/frontend/components/contact-form";
import { findServiceArea } from "@/frontend/data/service-areas";

export default async function Contact({ searchParams }: { searchParams: Promise<{ service?: string | string[] }> }) {
  const [{ service }, supabase, settings] = await Promise.all([searchParams, createClient(), getSiteSettings()]);
  const { data: { user } } = await supabase.auth.getUser();
  const initialService = findServiceArea(typeof service === "string" ? service : undefined)?.title ?? "";
  const whatsappHref = whatsappLink(settings.whatsapp_number);
  return <><section className="page-hero"><div className="container"><div className="eyebrow">Start a project</div><h1>Tell us what you’re trying to make better.</h1><p className="lead">Share a little context and we’ll reply within one business day.</p></div></section><section className="section"><div className="container contact-grid"><div><ContactForm signedIn={Boolean(user)} initialService={initialService} /></div><aside className="contact-side"><div className="eyebrow">Contact</div><div className="side-block"><h3>Email</h3><p><a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></p></div><div className="side-block"><h3>What happens next</h3><p>01 — We read your note<br/>02 — We reply with useful questions<br/>03 — We decide together if a call helps</p></div>{whatsappHref && <div className="side-block"><h3>Prefer WhatsApp?</h3><p><a href={whatsappHref}>Start a chat →</a></p></div>}</aside></div></section></>;
}
