"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/backend/supabase/client";

export function AdminRequestActions({
  requestId,
  initialStatus,
  hasProject,
}: {
  requestId: string;
  initialStatus: string;
  hasProject: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function updateStatus(nextStatus: string) {
    setBusy(true);
    setMessage("");
    const { data, error } = await createClient()
      .from("project_requests")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .select("id");
    if (error || !data?.length) {
      setMessage("Could not update this request.");
    } else {
      setStatus(nextStatus);
      router.refresh();
    }
    setBusy(false);
  }

  async function deleteRequest() {
    // Matches the foreign keys: services, proposals, and notifications cascade; the conversation,
    // projects, and invoices are kept but lose their link to this request.
    const warning = [
      "Delete this request permanently?",
      "Its selected services, proposals, and notifications are deleted too. The conversation is kept.",
      hasProject
        ? "Its project is kept, but the client will no longer see it or its tasks, documents, and invoices."
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    if (!window.confirm(warning)) return;
    setBusy(true);
    const { data, error } = await createClient().from("project_requests").delete().eq("id", requestId).select("id");
    if (error || !data?.length) {
      setMessage("Could not delete this request.");
      setBusy(false);
      return;
    }
    router.push("/admin/requests");
    router.refresh();
  }

  return (
    <div className="request-actions">
      <div className="request-action-row">
        <button
          type="button"
          className={`request-action ${status === "in_progress" ? "selected" : ""}`}
          disabled={busy}
          onClick={() => updateStatus("in_progress")}
        >
          Accept / work on it
        </button>
        <button
          type="button"
          className={`request-action request-action-warning ${status === "declined" ? "selected" : ""}`}
          disabled={busy}
          onClick={() => updateStatus("declined")}
        >
          Decline request
        </button>
        <button
          type="button"
          className={`request-action ${status === "completed" ? "selected" : ""}`}
          disabled={busy}
          onClick={() => updateStatus("completed")}
        >
          Mark completed
        </button>
        {status !== "received" && (
          <button type="button" className="request-action" disabled={busy} onClick={() => updateStatus("received")}>
            {status === "declined" ? "Restore request" : "Move back to received"}
          </button>
        )}
      </div>
      <button type="button" className="request-delete" disabled={busy} onClick={deleteRequest}>
        Delete permanently
      </button>
      {message && (
        <small className="admin-message" role="alert">
          {message}
        </small>
      )}
    </div>
  );
}
