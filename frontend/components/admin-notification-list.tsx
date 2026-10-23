"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/backend/supabase/client";
import { UNREAD_EVENT } from "@/frontend/components/account";
import { BellIcon } from "@/frontend/components/icons";
import { formatDateTime } from "@/lib/format";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  request_id: string | null;
  conversation_id?: string | null;
  read_at: string | null;
  created_at: string;
};

export function AdminNotificationList({ initialNotifications }: { initialNotifications: Notification[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialNotifications);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function markRead(ids: string[], savingKey: string) {
    setSaving(savingKey);
    setError("");
    const readAt = new Date().toISOString();
    const { error: updateError } = await createClient()
      .from("admin_notifications")
      .update({ read_at: readAt })
      .in("id", ids);
    if (updateError) {
      setError("Could not mark these as read. Please try again.");
    } else {
      setItems((current) => current.map((item) => (ids.includes(item.id) ? { ...item, read_at: readAt } : item)));
      // The header bell counts in the browser, so tell it to recount; refresh updates the page's own counts.
      window.dispatchEvent(new Event(UNREAD_EVENT));
      router.refresh();
    }
    setSaving(null);
  }

  const unreadIds = items.filter((item) => !item.read_at).map((item) => item.id);
  return (
    <div className="notification-center">
      <div className="notification-center-head">
        <div>
          <h2>Notifications</h2>
          <p>New service requests and important admin activity.</p>
          {error && (
            <p className="form-message" role="alert">
              {error}
            </p>
          )}
        </div>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => markRead(unreadIds, "all")}
          disabled={!unreadIds.length || saving !== null}
        >
          {saving === "all" ? "Saving..." : "Mark all as read"}
        </button>
      </div>
      {items.length ? (
        <div className="notification-list">
          {items.map((item) => (
            <article className={`notification-item ${item.read_at ? "is-read" : "is-unread"}`} key={item.id}>
              <div className="notification-item-icon">
                <BellIcon />
              </div>
              <div className="notification-item-body">
                <div className="notification-item-top">
                  <strong>{item.title}</strong>
                  {!item.read_at && <span className="notification-unread-dot">New</span>}
                </div>
                <p>{item.body}</p>
                <small>{formatDateTime(item.created_at)}</small>
                {item.request_id && (
                  <Link className="notification-view-link" href={`/admin/requests/${item.request_id}`}>
                    Open request →
                  </Link>
                )}
              </div>
              {!item.read_at && (
                <button
                  className="btn btn-ghost btn-small"
                  type="button"
                  onClick={() => markRead([item.id], item.id)}
                  disabled={saving !== null}
                >
                  {saving === item.id ? "Saving..." : "Mark read"}
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>All clear.</h2>
          <p>New service requests will appear here.</p>
        </div>
      )}
    </div>
  );
}
