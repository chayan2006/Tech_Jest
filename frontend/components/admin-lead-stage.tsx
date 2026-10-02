"use client";

import { useState } from "react";
import { createClient } from "@/backend/supabase/client";

export const leadStages = [
  ["received", "Received"],
  ["qualified", "Qualified"],
  ["proposal", "Proposal"],
  ["negotiation", "Negotiation"],
  ["won", "Won"],
  ["project", "Project"],
] as const;

type LeadStage = (typeof leadStages)[number][0];

export function AdminLeadStage({ requestId, initialStage }: { requestId: string; initialStage: LeadStage }) {
  const [stage, setStage] = useState<LeadStage>(initialStage);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function update(nextStage: LeadStage) {
    setSaving(true);
    setMessage("");
    const { error } = await createClient().from("project_requests").update({ lead_stage: nextStage }).eq("id", requestId);
    if (error) {
      setMessage("Could not update");
    } else {
      setStage(nextStage);
    }
    setSaving(false);
  }

  return <label className="admin-status-control"><span>Lead stage</span><select value={stage} onChange={event => update(event.target.value as LeadStage)} disabled={saving}>{leadStages.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>{message && <small role="alert">{message}</small>}</label>;
}
