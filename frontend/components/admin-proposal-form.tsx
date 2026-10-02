"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/backend/supabase/client";

export function AdminProposalForm({ requestId, defaultTitle }: { requestId: string; defaultTitle: string }) {
  const [title, setTitle] = useState(`Proposal: ${defaultTitle}`);
  const [summary, setSummary] = useState("");
  const [amount, setAmount] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [status, setStatus] = useState("draft");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const { error } = await createClient().from("proposals").insert({
      request_id: requestId,
      title: title.trim(),
      summary: summary.trim(),
      amount: amount ? Number(amount) : null,
      valid_until: validUntil || null,
      status,
    });
    setMessage(error ? "Could not save proposal. Confirm the latest schema is applied." : "Proposal saved.");
    if (!error) {
      setSummary("");
      setAmount("");
      setValidUntil("");
    }
    setSaving(false);
  }

  return <form className="admin-form" onSubmit={submit}>
    <label>Title<input value={title} onChange={event => setTitle(event.target.value)} required maxLength={200} /></label>
    <label>Summary<textarea value={summary} onChange={event => setSummary(event.target.value)} required minLength={1} maxLength={5000} rows={4} /></label>
    <div className="admin-form-grid"><label>Amount (INR)<input type="number" min="0" step="1" value={amount} onChange={event => setAmount(event.target.value)} /></label><label>Valid until<input type="date" value={validUntil} onChange={event => setValidUntil(event.target.value)} /></label></div>
    <label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="declined">Declined</option></select></label>
    <button className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save proposal"}</button>
    {message && <p className="admin-message" role="status">{message}</p>}
  </form>;
}
