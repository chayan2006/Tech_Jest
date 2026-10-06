"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { categories, formatPrice } from "@/frontend/data/services";
import type { ServiceCategory } from "@/frontend/data/services";
import type { Service } from "@/frontend/data/services";
import { AddToCartButton, CartSummary, CartToast, getCart } from "@/frontend/components/service-cart";

export function ServiceMarketplace({ services }: { services: Service[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [sort, setSort] = useState("popular");
  const [cartSlugs, setCartSlugs] = useState<string[]>([]);
  useEffect(() => { const sync = () => setCartSlugs(getCart()); sync(); window.addEventListener("techjest-cart-updated", sync); return () => window.removeEventListener("techjest-cart-updated", sync); }, []);
  const popularServices = useMemo(() => services.filter(item => item.popular), [services]);
  const selected = useMemo(() => services.filter(item => cartSlugs.includes(item.slug)), [cartSlugs, services]);
  const filtered = useMemo(() => services.filter(item => {
    const matchesCategory = category === "All" || item.category === category;
    const text = `${item.name} ${item.description} ${item.category}`.toLowerCase();
    return matchesCategory && text.includes(query.toLowerCase().trim());
  }).sort((a, b) => sort === "price" ? (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER) : sort === "name" ? a.name.localeCompare(b.name) : Number(Boolean(b.popular)) - Number(Boolean(a.popular))), [category, query, services, sort]);
  return <>
    <section className="marketplace-hero"><div className="container"><div className="eyebrow">Build your project</div><h1>Technology services, selected for your next move.</h1><p className="lead">Explore individual services, combine what you need into a project package, and request a clear quote from the TechJest team.</p><div className="marketplace-search"><span aria-hidden="true">⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search services, solutions, or integrations..." aria-label="Search services" /></div></div></section>
    <section className="section marketplace-section"><div className="container"><div className="marketplace-layout"><div><div className="marketplace-toolbar"><div><strong>{filtered.length} services</strong><span> available for your project</span></div><select value={sort} onChange={event => setSort(event.target.value)} aria-label="Sort services"><option value="popular">Sort: Popular</option><option value="price">Sort: Starting price</option><option value="name">Sort: Name (A–Z)</option></select></div><div className="category-list">{categories.map(item => <button type="button" className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="service-market-grid">{filtered.map(item => <article className="market-service-card" key={item.slug}><div className="market-service-icon">{item.icon}</div><div className="market-service-meta"><span>{item.category}</span><span>{item.delivery}</span></div><h2>{item.name}</h2><p>{item.description}</p><div className="market-service-price">{formatPrice(item.price)}</div><div className="market-service-actions"><Link className="btn btn-ghost" href={`/services/${item.slug}`}>View details</Link><AddToCartButton service={item} /></div></article>)}</div>{!filtered.length && <div className="empty-state"><h2>No services found.</h2><p>Try another search or browse all categories.</p></div>}</div><aside><div className="popular-panel"><div className="eyebrow">Popular services</div><h2>Common starting points.</h2>{popularServices.slice(0, 6).map(item => <Link href={`/services/${item.slug}`} key={item.slug}><span>{item.icon}</span><strong>{item.name}</strong><small>{formatPrice(item.price)}</small></Link>)}</div>{selected.length > 0 && <CartSummary services={selected} />}</aside></div></div></section>
    <section className="section marketplace-cta"><div className="container cta-row"><div><div className="eyebrow">Need something different?</div><h2>Can’t find the right service?</h2><p className="lead">Tell us what you need and we’ll shape a custom solution around your business.</p></div><Link className="btn btn-primary" href="/contact">Request custom solution</Link></div></section><CartToast />
  </>;
}
