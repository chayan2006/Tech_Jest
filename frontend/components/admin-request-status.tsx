"use client";

import { useState } from "react";
import { createClient } from "@/backend/supabase/client";

type Status = "received" | "in_progress" | "completed";

export function AdminRequestStatus({ requestId, initialStatus }: { requestId: string; initialStatus: Status }) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function update(nextStatus: Status) {
    setSaving(true);
    setMessage("");
    const { error } = await createClient().from("project_requests").update({ status: nextStatus }).eq("id", requestId);
    if (error) {
      setMessage("Could not update");
    } else {
      setStatus(nextStatus);
    }
    setSaving(false);
  }

  return <label className="admin-status-control"><span>Status</span><select value={status} onChange={event => update(event.target.value as Status)} disabled={saving}><option value="received">Received</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select>{message && <small role="alert">{message}</small>}</label>;
}
