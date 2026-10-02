"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/backend/supabase/client";

type Conversation = { id: string; title: string; status: string; priority: string; last_message_at?: string | null };
type Message = { id: string; sender_id: string; sender_type: string; content: string; message_type: string; created_at: string };

export function MessageThread({ conversation, currentUserId, admin = false }: { conversation: Conversation; currentUserId?: string; admin?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [internal, setInternal] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`);
      if (!response.ok) throw new Error("Could not load messages");
      setMessages(await response.json() as Message[]);
      setLoadError("");
    } catch {
      setLoadError("Messages could not be loaded. Check your connection and try again.");
    }
    setLoading(false);
  }
  useEffect(() => {
    void load();
    const supabase = createClient();
    const channel = supabase.channel(`conversation-${conversation.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversation.id}` }, () => void load()).subscribe();
    const timer = window.setInterval(() => void load(), 15000);
    return () => { window.clearInterval(timer); void supabase.removeChannel(channel); };
  }, [conversation.id]);
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    setStatus("");
    setSending(true);
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, internal }) });
      if (!response.ok) { setStatus("Message could not be sent. Please try again."); return; }
      const message = await response.json() as Message;
      setMessages(current => [...current, message]);
      setContent("");
      setStatus("Sent");
    } catch {
      setStatus("Message could not be sent. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }
  return <section className="message-thread"><header className="message-thread-head"><div><span className="eyebrow">{admin ? "Client conversation" : "TechJest support"}</span><h2>{conversation.title}</h2></div><span className={`admin-status status-${conversation.status}`}>{conversation.status.replaceAll("_", " ")}</span></header><div className="message-list" aria-live="polite">{loading ? <p className="admin-message">Loading conversation...</p> : loadError ? <div className="empty-state"><p>{loadError}</p><button type="button" className="btn btn-ghost" onClick={() => { setLoading(true); void load(); }}>Try again</button></div> : messages.length ? messages.map(message => <article className={`message-bubble ${message.sender_type === "internal" ? "message-internal" : message.sender_id === currentUserId ? "message-own" : "message-other"}`} key={message.id}><div className="message-label">{message.sender_type === "internal" ? "🔒 Internal note" : message.sender_type === "admin" ? "TechJest" : message.sender_id === currentUserId ? "You" : "Client"}</div><p>{message.content}</p><time>{new Date(message.created_at).toLocaleString("en-IN")}</time></article>) : <p className="admin-message">No messages yet. Start the conversation below.</p>}</div><form className="message-composer" onSubmit={send}><textarea aria-label={internal ? "Internal note" : "Message"} value={content} onChange={event => setContent(event.target.value)} placeholder={internal ? "Write an internal note..." : "Write a message..."} rows={3} maxLength={5000} disabled={sending} /><div className="message-composer-actions">{admin && <label className="admin-checkbox"><input type="checkbox" checked={internal} onChange={event => setInternal(event.target.checked)} disabled={sending} /> Internal note</label>}<button type="submit" className="btn btn-primary" disabled={!content.trim() || sending}>{sending ? "Sending..." : "Send message"}</button></div>{status && <small className="admin-message" role="status">{status}</small>}</form></section>;
}
