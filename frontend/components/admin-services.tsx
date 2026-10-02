"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/backend/supabase/client";
import type { Service } from "@/frontend/data/services";

const categories = ["Web Development", "E-Commerce", "AI & Automation", "Business Automation", "Mobile Development", "Design", "Digital Solutions", "Maintenance & Support"];
type Draft = Omit<Service, "popular"> & { popular: boolean; is_active: boolean };

function toDraft(service: Service, isActive = true): Draft {
  return { ...service, popular: Boolean(service.popular), is_active: isActive };
}

export function AdminServices({ initialServices, databaseReady }: { initialServices: Service[]; databaseReady: boolean }) {
  const [items, setItems] = useState(() => initialServices.map(service => toDraft(service)));
  const [message, setMessage] = useState(databaseReady ? "" : "Apply the service catalog migration before saving.");
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function save(service: Draft) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("service_catalog").upsert({
      ...service,
      price: service.price === null || service.price === undefined ? null : Number(service.price),
      included: service.included,
      technologies: service.technologies,
      updated_at: new Date().toISOString(),
    }, { onConflict: "slug" });
    setMessage(error ? "Could not save service. Confirm the latest schema and admin role." : `${service.name} saved.`);
    setSaving(false);
  }

  async function importCatalog() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("service_catalog").upsert(
      items.map((service, index) => ({ ...service, sort_order: index, updated_at: new Date().toISOString() })),
      { onConflict: "slug" },
    );
    setMessage(error ? "Could not import the catalog. Confirm the latest schema and admin role." : "Current catalog imported. You can now edit every service here.");
    setSaving(false);
  }

  function update(slug: string, patch: Partial<Draft>) {
    setItems(current => current.map(item => item.slug === slug ? { ...item, ...patch } : item));
  }

  async function submitNew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const service: Draft = {
      slug: String(form.get("slug")).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      name: String(form.get("name")).trim(),
      category: String(form.get("category")) as Service["category"],
      description: String(form.get("description")).trim(),
      price: form.get("price") ? Number(form.get("price")) : null,
      delivery: String(form.get("delivery")).trim(),
      icon: String(form.get("icon") || "✦").trim(),
      popular: form.get("popular") === "on",
      included: String(form.get("included")).split("\n").map(value => value.trim()).filter(Boolean),
      technologies: String(form.get("technologies")).split(",").map(value => value.trim()).filter(Boolean),
      is_active: true,
    };
    if (!service.slug || !service.name || !service.description || !service.delivery) {
      setMessage("Name, slug, description, and delivery are required.");
      return;
    }
    await save(service);
    setItems(current => [...current, service]);
    setShowNew(false);
  }

  return <div className="admin-service-manager">
    <div className="admin-panel-head"><div><h2>Service catalog</h2><p>Add, edit, publish, archive, and reorder the services shown on the public services page.</p></div><div className="admin-detail-controls"><button type="button" className="btn btn-ghost" disabled={saving || !databaseReady} onClick={importCatalog}>Import current catalog</button><button type="button" className="btn btn-primary" onClick={() => setShowNew(current => !current)}> {showNew ? "Close form" : "Add service"} </button></div></div>
    {showNew && <form className="admin-form service-create-form" onSubmit={submitNew}><div className="admin-form-grid"><label>Name<input name="name" required /></label><label>Slug<input name="slug" required placeholder="service-slug" /></label><label>Category<select name="category" defaultValue={categories[0]}>{categories.map(category => <option key={category}>{category}</option>)}</select></label><label>Starting price<input name="price" type="number" min="0" /></label><label>Delivery time<input name="delivery" required placeholder="1–2 weeks" /></label><label>Icon<input name="icon" defaultValue="✦" maxLength={4} /></label></div><label>Description<textarea name="description" required minLength={10} rows={3} /></label><div className="admin-form-grid"><label>Included deliverables<span className="admin-field-help">One item per line.</span><textarea name="included" rows={4} /></label><label>Technologies<span className="admin-field-help">Comma separated.</span><textarea name="technologies" rows={4} /></label></div><label className="admin-checkbox"><input name="popular" type="checkbox" /> Feature as popular</label><button className="btn btn-primary" disabled={saving}>Create service</button></form>}
    <div className="admin-service-list">{items.map(item => <article className={`admin-service-row ${item.is_active ? "" : "is-archived"}`} key={item.slug}><div className="admin-service-row-head"><div><span className="eyebrow">{item.category}</span><h3>{item.name}</h3><small>/{item.slug}</small></div><label className="admin-checkbox"><input type="checkbox" checked={item.is_active} onChange={event => update(item.slug, { is_active: event.target.checked })} /> Published</label></div><div className="admin-form-grid"><label>Name<input value={item.name} onChange={event => update(item.slug, { name: event.target.value })} /></label><label>Category<select value={item.category} onChange={event => update(item.slug, { category: event.target.value as Service["category"] })}>{categories.map(category => <option key={category}>{category}</option>)}</select></label><label>Starting price<input type="number" min="0" value={item.price ?? ""} onChange={event => update(item.slug, { price: event.target.value ? Number(event.target.value) : null })} /></label><label>Delivery<input value={item.delivery} onChange={event => update(item.slug, { delivery: event.target.value })} /></label></div><label>Description<textarea rows={2} value={item.description} onChange={event => update(item.slug, { description: event.target.value })} /></label><div className="admin-form-grid"><label>Included deliverables<span className="admin-field-help">One item per line.</span><textarea rows={3} value={item.included.join("\n")} onChange={event => update(item.slug, { included: event.target.value.split("\n").filter(Boolean) })} /></label><label>Technologies<span className="admin-field-help">Comma separated.</span><textarea rows={3} value={item.technologies.join(", ")} onChange={event => update(item.slug, { technologies: event.target.value.split(",").map(value => value.trim()).filter(Boolean) })} /></label></div><div className="admin-detail-controls"><label className="admin-checkbox"><input type="checkbox" checked={item.popular} onChange={event => update(item.slug, { popular: event.target.checked })} /> Popular</label><button type="button" className="btn btn-primary" disabled={saving || !databaseReady} onClick={() => save(item)}>Save changes</button></div></article>)}</div>{message && <p className="admin-message" role="status">{message}</p>}</div>;
}
