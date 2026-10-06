"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/backend/supabase/client";

type RequestOption = { id: string; label: string };

// A project must belong to a client request; clients can only see projects linked to their own request.
export function AdminProjectForm({ requestId, proposalId, defaultName, requests = [] }: { requestId?: string; proposalId?: string; defaultName?: string; requests?: RequestOption[] }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName ?? "");
  const [selectedRequest, setSelectedRequest] = useState(requestId ?? "");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const { error } = await createClient().from("projects").insert({ name: name.trim(), request_id: selectedRequest || null, proposal_id: proposalId || null, start_date: startDate || null, target_date: targetDate || null });
    setMessage(error ? "Could not create project. Confirm the latest schema is applied." : "Project created. The client can now see it in their dashboard.");
    if (!error) {
      setName(defaultName ?? "");
      router.refresh();
    }
    setSaving(false);
  }
  return <form className="admin-form" onSubmit={submit}>{!requestId && <label>Client request<select value={selectedRequest} onChange={event => setSelectedRequest(event.target.value)} required><option value="" disabled>{requests.length ? "Choose the request this project delivers" : "No client requests yet"}</option>{requests.map(request => <option key={request.id} value={request.id}>{request.label}</option>)}</select></label>}<label>Project name<input value={name} onChange={event => setName(event.target.value)} required maxLength={200} /></label><div className="admin-form-grid"><label>Start date<input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></label><label>Target date<input type="date" value={targetDate} onChange={event => setTargetDate(event.target.value)} /></label></div><button className="btn btn-primary" disabled={saving}>{saving ? "Creating..." : "Create project"}</button>{message && <p className="admin-message" role="status">{message}</p>}</form>;
}
