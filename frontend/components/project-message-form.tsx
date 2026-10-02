"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/backend/supabase/client";

export function ProjectMessageForm({ projectId }: { projectId: string }) {
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const { data: { user } } = await createClient().auth.getUser();
    const { error } = user ? await createClient().from("project_messages").insert({ project_id: projectId, user_id: user.id, body: body.trim() }) : { error: new Error("Not signed in") };
    setMessage(error ? "Message could not be sent." : "Message sent.");
    if (!error) setBody("");
    setSaving(false);
  }
  return <form className="admin-form" onSubmit={submit}><label>Message<textarea value={body} onChange={event => setBody(event.target.value)} required minLength={1} maxLength={5000} rows={3} /></label><button className="btn btn-primary" disabled={saving}>{saving ? "Sending..." : "Send message"}</button>{message && <p className="admin-message" role="status">{message}</p>}</form>;
}
