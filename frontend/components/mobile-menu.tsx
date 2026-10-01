"use client";

import Link from "next/link";
import { useState } from "react";
import { CartLink } from "@/frontend/components/service-cart";

const links: readonly (readonly [string, string])[] = [["Services", "/services"], ["Work", "/portfolio"], ["About", "/about"], ["Contact", "/contact"]];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  return <div className="mobile-menu">
    <button className="menu-btn" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "×" : "☰"}</button>
    {open && <div className="mobile-panel" role="dialog" aria-label="Mobile navigation">
      <nav aria-label="Mobile navigation">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}</nav>
      <CartLink />
      <Link className="btn btn-primary" href="/contact" onClick={() => setOpen(false)}>Book a consultation</Link>
    </div>}
  </div>;
}
