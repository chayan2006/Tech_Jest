"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/backend/supabase/client";

export function AdminRequestActions({ requestId, initialStatus }: { requestId: string; initialStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function updateStatus(nextStatus: string) {
    setBusy(true);
    setMessage("");
    const { error } = await createClient().from("project_requests").update({ status: nextStatus }).eq("id", requestId);
    if (error) setMessage("Could not update this request.");
    else setStatus(nextStatus);
    setBusy(false);
  }

  async function deleteRequest() {
    if (!window.confirm("Delete this request permanently? Its service snapshots, conversation, and notifications will also be removed.")) return;
    setBusy(true);
    const { error } = await createClient().from("project_requests").delete().eq("id", requestId);
    if (error) {
      setMessage("Could not delete this request.");
      setBusy(false);
      return;
    }
    router.push("/admin/requests");
    router.refresh();
  }

  return <div className="request-actions"><div className="request-action-row"><button type="button" className={`request-action ${status === "in_progress" ? "selected" : ""}`} disabled={busy} onClick={() => updateStatus("in_progress")}>Accept / work on it</button><button type="button" className={`request-action request-action-warning ${status === "declined" ? "selected" : ""}`} disabled={busy} onClick={() => updateStatus("declined")}>Decline request</button><button type="button" className={`request-action ${status === "completed" ? "selected" : ""}`} disabled={busy} onClick={() => updateStatus("completed")}>Mark completed</button>{status === "declined" && <button type="button" className="request-action" disabled={busy} onClick={() => updateStatus("received")}>Restore request</button>}</div><button type="button" className="request-delete" disabled={busy} onClick={deleteRequest}>Delete permanently</button>{message && <small className="admin-message" role="alert">{message}</small>}</div>;
}
