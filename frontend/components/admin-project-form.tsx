"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/backend/supabase/client";

export function AdminProjectForm({ requestId, proposalId, defaultName }: { requestId?: string; proposalId?: string; defaultName?: string }) {
  const [name, setName] = useState(defaultName ?? "");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const { error } = await createClient().from("projects").insert({ name: name.trim(), request_id: requestId || null, proposal_id: proposalId || null, start_date: startDate || null, target_date: targetDate || null });
    setMessage(error ? "Could not create project. Confirm the latest schema is applied." : "Project created.");
    if (!error) setName("");
    setSaving(false);
  }
  return <form className="admin-form" onSubmit={submit}><label>Project name<input value={name} onChange={event => setName(event.target.value)} required maxLength={200} /></label><div className="admin-form-grid"><label>Start date<input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></label><label>Target date<input type="date" value={targetDate} onChange={event => setTargetDate(event.target.value)} /></label></div><button className="btn btn-primary" disabled={saving}>{saving ? "Creating..." : "Create project"}</button>{message && <p className="admin-message" role="status">{message}</p>}</form>;
}
