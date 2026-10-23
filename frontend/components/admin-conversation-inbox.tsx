"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/backend/supabase/client";
import { AdminDeleteButton } from "@/frontend/components/admin-delete-button";
import { statusOptions } from "@/frontend/data/workflow";

export type InboxConversation = {
  id: string;
  title: string;
  client: string;
  status: string;
  statusLabel: string;
  lastMessage: string;
  newCount: number;
};

// The admin inbox: search and filter, open a conversation, delete one, or tick several and delete them together.
// Messages go with each conversation through the database cascade.
export function AdminConversationInbox({ conversations }: { conversations: InboxConversation[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const term = search.trim().toLowerCase();
  const visible = conversations.filter(
    (item) =>
      (!status || item.status === status) &&
      (!term || item.title.toLowerCase().includes(term) || item.client.toLowerCase().includes(term)),
  );
  // Only ticked rows that are on screen count: a row hidden by the search, or already deleted on its
  // own, is never deleted without being seen.
  const chosen = visible.filter((item) => selected.has(item.id)).map((item) => item.id);
  const allSelected = visible.length > 0 && chosen.length === visible.length;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function removeSelected() {
    const count = chosen.length;
    const noun = count === 1 ? "conversation" : "conversations";
    if (
      !window.confirm(
        `Delete ${count} ${noun}? Every message in them is removed for you and the clients. This cannot be undone.`,
      )
    )
      return;
    setBusy(true);
    const { data, error } = await createClient().from("conversations").delete().in("id", chosen).select("id");
    setBusy(false);
    if (error || !data?.length) {
      window.alert(`Could not delete the selected ${noun}.`);
      return;
    }
    if (data.length < count) window.alert(`Deleted ${data.length} of ${count} ${noun}.`);
    setSelected(new Set());
    router.refresh();
  }

  return (
    <>
      <div className="admin-filter" role="search">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search title or client…"
          aria-label="Search conversations"
        />
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {statusOptions.conversation
            .filter(([value]) => value !== "archived")
            .map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
        </select>
      </div>
      <div className="conversation-bulk-bar">
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(visible.map((item) => item.id)))}
            disabled={busy}
          />{" "}
          Select all
        </label>
        {chosen.length > 0 && (
          <button type="button" className="btn btn-small btn-danger" onClick={removeSelected} disabled={busy}>
            {busy ? "Deleting…" : `Delete selected (${chosen.length})`}
          </button>
        )}
      </div>
      {visible.length === 0 && <p className="admin-message">No conversations match this search.</p>}
      <div className="conversation-inbox">
        {visible.map((item) => (
          <div className="conversation-inbox-item" key={item.id}>
            <input
              type="checkbox"
              className="conversation-select"
              checked={selected.has(item.id)}
              onChange={() => toggle(item.id)}
              disabled={busy}
              aria-label={`Select ${item.title}`}
            />
            <Link className="conversation-inbox-row" href={`/admin/messages/${item.id}`}>
              <div>
                <strong>
                  {item.title}
                  {item.newCount > 0 && <span className="notification-unread-dot">{item.newCount} new</span>}
                </strong>
                <small>{item.client}</small>
              </div>
              <div>
                <span className={`admin-status status-${item.status}`}>{item.statusLabel}</span>
                <small>{item.lastMessage}</small>
              </div>
            </Link>
            <AdminDeleteButton kind="conversation" id={item.id} name={item.title} />
          </div>
        ))}
      </div>
    </>
  );
}
