"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartLink } from "@/frontend/components/service-cart";
import { CloseIcon, MenuIcon } from "@/frontend/components/icons";

const links: readonly (readonly [string, string])[] = [
  ["Services", "/services"],
  ["Work", "/portfolio"],
  ["About", "/about"],
  ["Contact", "/contact"],
];

export function MobileMenu({ signedIn = false, admin = false }: { signedIn?: boolean; admin?: boolean }) {
  const [open, setOpen] = useState(false);
  const accountLinks: readonly (readonly [string, string])[] = signedIn
    ? [
        [admin ? "Admin console" : "My dashboard", admin ? "/admin" : "/dashboard"],
        ["Messages", admin ? "/admin/messages" : "/messages"],
      ]
    : [["Login", "/auth"]];
  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  return (
    <div className="mobile-menu">
      <button
        type="button"
        className="menu-btn"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-navigation-panel"
        onClick={() => setOpen(!open)}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      {open && (
        <div id="mobile-navigation-panel" className="mobile-panel" role="dialog" aria-label="Mobile navigation">
          <nav aria-label="Mobile navigation">
            {[...links, ...accountLinks].map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
          </nav>
          <CartLink />
          <Link className="btn btn-primary" href="/contact" onClick={() => setOpen(false)}>
            Book a consultation
          </Link>
          {signedIn && (
            <form action="/auth/signout" method="post">
              <button className="text-button" type="submit">
                Log out
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
