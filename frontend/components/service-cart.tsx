"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Service } from "@/frontend/data/services";
import { formatPrice } from "@/frontend/data/services";
import { CartIcon } from "@/frontend/components/icons";

const CART_EVENT = "techjest-cart-updated";
const CART_KEY = "techjest-service-cart";

export function getCart(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}
function addToCart(slug: string) {
  const cart = getCart();
  if (!cart.includes(slug)) {
    window.localStorage.setItem(CART_KEY, JSON.stringify([...cart, slug]));
    window.dispatchEvent(new Event(CART_EVENT));
    return true;
  }
  return false;
}
export function removeFromCart(slug: string) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(getCart().filter((item) => item !== slug)));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function CartLink() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(getCart().length);
    update();
    window.addEventListener(CART_EVENT, update);
    return () => window.removeEventListener(CART_EVENT, update);
  }, []);
  return (
    <Link className="cart-link" href="/cart" aria-label={`Project cart, ${count} services selected`}>
      <CartIcon /> Cart <b>({count})</b>
    </Link>
  );
}

export function AddToCartButton({ service }: { service: Service }) {
  const [added, setAdded] = useState(false);
  useEffect(() => {
    setAdded(getCart().includes(service.slug));
  }, [service.slug]);
  function handleAdd() {
    const newItem = addToCart(service.slug);
    setAdded(true);
    if (newItem)
      window.dispatchEvent(new CustomEvent("techjest-toast", { detail: `${service.name} added to your project` }));
  }
  return (
    <button className={`btn ${added ? "btn-added" : "btn-primary"}`} type="button" onClick={handleAdd}>
      {added ? "Added to project" : "Add to project"}
    </button>
  );
}

export function CartToast() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    const handler = (event: Event) => {
      setMessage((event as CustomEvent<string>).detail);
      window.setTimeout(() => setMessage(""), 2400);
    };
    window.addEventListener("techjest-toast", handler);
    return () => window.removeEventListener("techjest-toast", handler);
  }, []);
  return message ? (
    <div className="cart-toast" role="status">
      {message}
    </div>
  ) : null;
}

export function CartSummary({ services }: { services: Service[] }) {
  const total = services.reduce((sum, item) => sum + (item.price ?? 0), 0);
  return (
    <aside className="cart-summary">
      <div className="eyebrow">Your project</div>
      <h2>
        {services.length} service{services.length === 1 ? "" : "s"} selected
      </h2>
      {services.map((item) => (
        <div className="cart-summary-row" key={item.slug}>
          <span>{item.name}</span>
          <strong>{formatPrice(item.price)}</strong>
        </div>
      ))}
      <div className="cart-total">
        <span>Estimated starting total</span>
        <strong>{total ? `₹${total.toLocaleString("en-IN")}` : "Custom quote"}</strong>
      </div>
      <Link className="btn btn-primary" href="/cart#quote">
        Request a quote
      </Link>
    </aside>
  );
}
