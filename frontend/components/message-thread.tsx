"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/backend/supabase/client";
import { statusLabel } from "@/frontend/data/workflow";

type Conversation = { id: string; title: string; status: string; priority: string; last_message_at?: string | null };
type Message = {
  id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  message_type: string;
  created_at: string;
};

export function MessageThread({
  conversation,
  currentUserId,
  admin = false,
}: {
  conversation: Conversation;
  currentUserId?: string;
  admin?: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [internal, setInternal] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sending, setSending] = useState(false);
  // How many messages this view has seen, so a new arrival can refresh the status around the thread.
  const knownCount = useRef<number | null>(null);

  async function load() {
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`);
      if (!response.ok) throw new Error("Could not load messages");
      const loaded = (await response.json()) as Message[];
      setMessages(loaded);
      setLoadError("");
      if (knownCount.current !== null && loaded.length > knownCount.current) router.refresh();
      knownCount.current = loaded.length;
    } catch {
      setLoadError("Messages could not be loaded. Check your connection and try again.");
    }
    setLoading(false);
  }
  useEffect(() => {
    void load();
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    // Live updates must carry the signed-in session, or the security rules hide every message from them.
    // The browser client loads its session after the socket opens, so hand the token over before subscribing.
    void supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      if (cancelled) return;
      // A unique name per subscription: reusing one can hand a new subscription a channel that is still
      // being removed (React mounts effects twice in development), which silently stops live updates.
      channel = supabase
        .channel(`conversation-${conversation.id}-${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversation.id}` },
          () => void load(),
        )
        .subscribe();
    });
    const timer = window.setInterval(() => void load(), 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [conversation.id]);
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    setStatus("");
    setSending(true);
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, internal }),
      });
      if (!response.ok) {
        setStatus("Message could not be sent. Please try again.");
        return;
      }
      const message = (await response.json()) as Message;
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
      if (knownCount.current !== null) knownCount.current += 1;
      setContent("");
      setStatus(internal ? "Internal note saved" : "Sent");
      // The conversation's status changes with each message; refresh the badges and unread counts around the thread.
      router.refresh();
    } catch {
      setStatus("Message could not be sent. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }
  return (
    <section className="message-thread">
      <header className="message-thread-head">
        <div>
          <span className="eyebrow">{admin ? "Client conversation" : "TechJest support"}</span>
          <h2>{conversation.title}</h2>
        </div>
        <span className={`admin-status status-${conversation.status}`}>
          {statusLabel("conversation", conversation.status, admin ? "admin" : "client")}
        </span>
      </header>
      <div className="message-list" aria-live="polite">
        {loading ? (
          <p className="admin-message">Loading conversation...</p>
        ) : loadError ? (
          <div className="empty-state">
            <p>{loadError}</p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setLoading(true);
                void load();
              }}
            >
              Try again
            </button>
          </div>
        ) : messages.length ? (
          messages.map((message) => (
            <article
              className={`message-bubble ${message.sender_type === "internal" ? "message-internal" : message.sender_id === currentUserId ? "message-own" : "message-other"}`}
              key={message.id}
            >
              <div className="message-label">
                {message.sender_type === "internal"
                  ? "Internal note · only the TechJest team sees this"
                  : message.sender_type === "admin"
                    ? "TechJest"
                    : message.sender_id === currentUserId
                      ? "You"
                      : "Client"}
              </div>
              <p>{message.content}</p>
              <time dateTime={message.created_at}>
                {new Date(message.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </time>
            </article>
          ))
        ) : (
          <p className="admin-message">No messages yet. Start the conversation below.</p>
        )}
      </div>
      <form className="message-composer" onSubmit={send}>
        <textarea
          aria-label={internal ? "Internal note" : "Message"}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={internal ? "Write an internal note..." : "Write a message..."}
          rows={3}
          maxLength={5000}
          disabled={sending}
        />
        <div className="message-composer-actions">
          {admin && (
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={internal}
                onChange={(event) => setInternal(event.target.checked)}
                disabled={sending}
              />{" "}
              Internal note
            </label>
          )}
          <button type="submit" className="btn btn-primary" disabled={!content.trim() || sending}>
            {sending ? "Sending..." : "Send message"}
          </button>
        </div>
        {status && (
          <small className="admin-message" role="status">
            {status}
          </small>
        )}
      </form>
    </section>
  );
}
