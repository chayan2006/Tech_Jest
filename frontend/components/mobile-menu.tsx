"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartLink } from "@/frontend/components/service-cart";

const links: readonly (readonly [string, string])[] = [["Services", "/services"], ["Work", "/portfolio"], ["About", "/about"], ["Contact", "/contact"]];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  return <div className="mobile-menu">
    <button type="button" className="menu-btn" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-navigation-panel" onClick={() => setOpen(!open)}>{open ? "×" : "☰"}</button>
    {open && <div id="mobile-navigation-panel" className="mobile-panel" role="dialog" aria-label="Mobile navigation">
      <nav aria-label="Mobile navigation">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}</nav>
      <CartLink />
      <Link className="btn btn-primary" href="/contact" onClick={() => setOpen(false)}>Book a consultation</Link>
    </div>}
  </div>;
}
