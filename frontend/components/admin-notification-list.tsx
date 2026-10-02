"use client";

import { useState } from "react";
import { createClient } from "@/backend/supabase/client";
import Link from "next/link";

type Notification = { id: string; title: string; body: string; type: string; request_id: string | null; conversation_id?: string | null; read_at: string | null; created_at: string };

export function AdminNotificationList({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [items, setItems] = useState(initialNotifications);
  const [saving, setSaving] = useState<string | null>(null);
  async function markRead(id: string) {
    setSaving(id);
    const { error } = await createClient().from("admin_notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    if (!error) setItems(current => current.map(item => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
    setSaving(null);
  }
  async function markAllRead() {
    const unread = items.filter(item => !item.read_at);
    await Promise.all(unread.map(item => markRead(item.id)));
  }
  return <div className="notification-center"><div className="notification-center-head"><div><h2>Notifications</h2><p>New service requests and important admin activity.</p></div><button className="btn btn-ghost" type="button" onClick={markAllRead} disabled={!items.some(item => !item.read_at)}>Mark all as read</button></div>{items.length ? <div className="notification-list">{items.map(item => <article className={`notification-item ${item.read_at ? "is-read" : "is-unread"}`} key={item.id}><div className="notification-item-icon">{item.type === "service_request" ? "✦" : "🔔"}</div><div className="notification-item-body"><div className="notification-item-top"><strong>{item.title}</strong>{!item.read_at && <span className="notification-unread-dot">New</span>}</div><p>{item.body}</p><small>{new Date(item.created_at).toLocaleString("en-IN")}</small>{item.request_id && <Link className="notification-view-link" href={`/admin/requests/${item.request_id}`}>Open request →</Link>}</div>{!item.read_at && <button className="btn btn-ghost btn-small" type="button" onClick={() => markRead(item.id)} disabled={saving === item.id}>{saving === item.id ? "Saving..." : "✓ Mark read"}</button>}</article>)}</div> : <div className="empty-state"><h2>All clear.</h2><p>New service requests will appear here.</p></div>}</div>;
}
