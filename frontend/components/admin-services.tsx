"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/backend/supabase/client";
import { serviceCategories, type Service } from "@/frontend/data/services";
import { ServiceIcon } from "@/frontend/components/icons";

type CatalogService = Service & { is_active?: boolean };
type Draft = Omit<Service, "popular"> & { popular: boolean; is_active: boolean };

function toDraft(service: CatalogService): Draft {
  return { ...service, popular: Boolean(service.popular), is_active: service.is_active ?? true };
}

export function AdminServices({
  initialServices,
  databaseReady,
  databaseError,
}: {
  initialServices: CatalogService[];
  databaseReady: boolean;
  databaseError?: string;
}) {
  const [items, setItems] = useState(() => initialServices.map((service) => toDraft(service)));
  const [message, setMessage] = useState(
    databaseReady ? "" : `Live service catalog is unavailable${databaseError ? `: ${databaseError}` : "."}`,
  );
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [visibility, setVisibility] = useState("published");
  const [editing, setEditing] = useState<string | null>(null);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const text = `${item.name} ${item.slug} ${item.description}`.toLowerCase();
        const matchesQuery = text.includes(query.trim().toLowerCase());
        const matchesCategory = category === "All" || item.category === category;
        const matchesVisibility =
          visibility === "all" || (visibility === "published" ? item.is_active : !item.is_active);
        return matchesQuery && matchesCategory && matchesVisibility;
      }),
    [category, items, query, visibility],
  );

  async function save(service: Draft): Promise<boolean> {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("service_catalog").upsert(
      {
        ...service,
        price: service.price === null || service.price === undefined ? null : Number(service.price),
        included: service.included,
        technologies: service.technologies,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    );
    setMessage(error ? `Could not save service: ${error.message}` : `${service.name} saved to the live catalog.`);
    setSaving(false);
    return !error;
  }

  async function togglePublished(service: Draft, isActive: boolean) {
    const next = { ...service, is_active: isActive };
    update(service.slug, { is_active: isActive });
    if (!(await save(next))) update(service.slug, { is_active: service.is_active });
  }

  async function importCatalog() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("service_catalog").upsert(
      items.map((service, index) => ({ ...service, sort_order: index, updated_at: new Date().toISOString() })),
      { onConflict: "slug" },
    );
    setMessage(
      error
        ? `Could not import the catalog: ${error.message}`
        : "Current catalog imported. You can now edit every service here.",
    );
    setSaving(false);
  }

  function update(slug: string, patch: Partial<Draft>) {
    setItems((current) => current.map((item) => (item.slug === slug ? { ...item, ...patch } : item)));
  }

  async function submitNew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const service: Draft = {
      slug: String(form.get("slug"))
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      name: String(form.get("name")).trim(),
      category: String(form.get("category")) as Service["category"],
      description: String(form.get("description")).trim(),
      price: form.get("price") ? Number(form.get("price")) : null,
      delivery: String(form.get("delivery")).trim(),
      popular: form.get("popular") === "on",
      included: String(form.get("included"))
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
      technologies: String(form.get("technologies"))
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      is_active: true,
    };
    if (!service.slug || !service.name || !service.description || !service.delivery) {
      setMessage("Name, slug, description, and delivery are required.");
      return;
    }
    if (await save(service)) {
      setItems((current) => [...current, service]);
      setShowNew(false);
    }
  }

  return (
    <div className="admin-service-manager">
      <div className="admin-panel-head">
        <div>
          <h2>Service catalog</h2>
          <p>Add, edit, publish, and archive the services shown on the public services page.</p>
          {!databaseReady && (
            <p className="admin-message" role="alert">
              The page is showing local draft services only. Nothing here is published until the Supabase catalog
              connection is fixed.
            </p>
          )}
        </div>
        <div className="admin-detail-controls">
          <button type="button" className="btn btn-ghost" disabled={saving || !databaseReady} onClick={importCatalog}>
            Import current catalog
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setShowNew((current) => !current)}>
            {" "}
            {showNew ? "Close form" : "Add service"}{" "}
          </button>
        </div>
      </div>
      <div className="service-admin-stats">
        <div>
          <strong>{items.length}</strong>
          <span>Total services</span>
        </div>
        <div>
          <strong>{items.filter((item) => item.is_active).length}</strong>
          <span>Published on website</span>
        </div>
        <div>
          <strong>{items.filter((item) => !item.is_active).length}</strong>
          <span>Archived</span>
        </div>
        <div>
          <strong>{items.filter((item) => item.popular && item.is_active).length}</strong>
          <span>Popular on website</span>
        </div>
      </div>
      {showNew && (
        <form className="admin-form service-create-form" onSubmit={submitNew}>
          <div className="service-form-intro">
            <div>
              <h3>Create a new service</h3>
              <p>Fill the essentials first. You can refine the details later.</p>
            </div>
            <button type="button" className="text-button" onClick={() => setShowNew(false)}>
              Cancel
            </button>
          </div>
          <div className="admin-form-grid">
            <label>
              Name
              <input name="name" required placeholder="e.g. Growth website" />
            </label>
            <label>
              Slug
              <input name="slug" required placeholder="growth-website" />
            </label>
            <label>
              Category
              <select name="category" defaultValue={serviceCategories[0]}>
                {serviceCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              Starting price
              <input name="price" type="number" min="0" placeholder="Leave empty for custom quote" />
            </label>
            <label>
              Delivery time
              <input name="delivery" required placeholder="1–2 weeks" />
            </label>
          </div>
          <label>
            Description
            <textarea
              name="description"
              required
              minLength={10}
              rows={3}
              placeholder="Explain the outcome this service delivers."
            />
          </label>
          <div className="admin-form-grid">
            <label>
              Included deliverables<span className="admin-field-help">One item per line.</span>
              <textarea name="included" rows={4} placeholder={"Responsive pages\nContact form\nDeployment"} />
            </label>
            <label>
              Technologies<span className="admin-field-help">Comma separated.</span>
              <textarea name="technologies" rows={4} placeholder="Next.js, Supabase, TypeScript" />
            </label>
          </div>
          <label className="admin-checkbox">
            <input name="popular" type="checkbox" /> Feature as popular
          </label>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Creating..." : "Create service"}
          </button>
        </form>
      )}
      <div className="service-admin-toolbar">
        <label className="service-search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search services..."
            aria-label="Search services"
          />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
          <option>All</option>
          {serviceCategories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={visibility}
          onChange={(event) => setVisibility(event.target.value)}
          aria-label="Filter by visibility"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <span className="service-results">{filteredItems.length} shown</span>
      </div>
      <div className="admin-service-list">
        {filteredItems.map((item) => (
          <article className={`admin-service-row ${item.is_active ? "" : "is-archived"}`} key={item.slug}>
            <div className="admin-service-row-head">
              <div className="service-row-identity">
                <span className="service-icon">
                  <ServiceIcon category={item.category} />
                </span>
                <div>
                  <div className="service-row-labels">
                    <span className="admin-pill">{item.category}</span>
                    <span className={`admin-pill ${item.is_active ? "pill-success" : "pill-muted"}`}>
                      {item.is_active ? "Published" : "Archived"}
                    </span>
                    {item.popular && <span className="admin-pill pill-featured">Popular</span>}
                  </div>
                  <h3>{item.name}</h3>
                  <small>/{item.slug}</small>
                </div>
              </div>
              <div className="service-row-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  onClick={() => setEditing(editing === item.slug ? null : item.slug)}
                >
                  {editing === item.slug ? "Close editor" : "Edit service"}
                </button>
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={item.is_active}
                    disabled={saving || !databaseReady}
                    onChange={(event) => togglePublished(item, event.target.checked)}
                  />{" "}
                  Published
                </label>
              </div>
            </div>
            <div className="service-row-summary">
              <span>{item.price === null ? "Custom quote" : `From ₹${item.price.toLocaleString("en-IN")}`}</span>
              <span>⏱ {item.delivery}</span>
              <span>{item.included.length} deliverables</span>
              <span>{item.technologies.length} technologies</span>
            </div>
            {editing === item.slug && (
              <div className="service-editor">
                <div className="admin-form-grid">
                  <label>
                    Name
                    <input value={item.name} onChange={(event) => update(item.slug, { name: event.target.value })} />
                  </label>
                  <label>
                    Category
                    <select
                      value={item.category}
                      onChange={(event) => update(item.slug, { category: event.target.value as Service["category"] })}
                    >
                      {serviceCategories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Starting price
                    <input
                      type="number"
                      min="0"
                      value={item.price ?? ""}
                      onChange={(event) =>
                        update(item.slug, { price: event.target.value ? Number(event.target.value) : null })
                      }
                    />
                  </label>
                  <label>
                    Delivery
                    <input
                      value={item.delivery}
                      onChange={(event) => update(item.slug, { delivery: event.target.value })}
                    />
                  </label>
                </div>
                <label>
                  Description
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(event) => update(item.slug, { description: event.target.value })}
                  />
                </label>
                <div className="admin-form-grid">
                  <label>
                    Included deliverables<span className="admin-field-help">One item per line.</span>
                    <textarea
                      rows={3}
                      value={item.included.join("\n")}
                      onChange={(event) =>
                        update(item.slug, { included: event.target.value.split("\n").filter(Boolean) })
                      }
                    />
                  </label>
                  <label>
                    Technologies<span className="admin-field-help">Comma separated.</span>
                    <textarea
                      rows={3}
                      value={item.technologies.join(", ")}
                      onChange={(event) =>
                        update(item.slug, {
                          technologies: event.target.value
                            .split(",")
                            .map((value) => value.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </label>
                </div>
                <div className="admin-detail-controls">
                  <label className="admin-checkbox">
                    <input
                      type="checkbox"
                      checked={item.popular}
                      onChange={(event) => update(item.slug, { popular: event.target.checked })}
                    />{" "}
                    Show as popular
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={saving || !databaseReady}
                    onClick={() => save(item)}
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
      {!filteredItems.length && (
        <div className="empty-state">
          <h2>No matching services</h2>
          <p>Try another search or filter, or create a new service.</p>
        </div>
      )}
      {message && (
        <p className="admin-message" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
