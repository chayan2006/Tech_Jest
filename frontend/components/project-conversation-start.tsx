"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProjectConversationStart({ projectId, title }: { projectId: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, title }) });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        setError(result?.error ?? "Could not start the conversation.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not start the conversation. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return <div><p className="admin-message">Questions about this project? Message the TechJest team — replies appear here and in your message center.</p><button type="button" className="btn btn-primary" onClick={start} disabled={busy}>{busy ? "Starting…" : "Message the TechJest team"}</button>{error && <p className="form-message" role="alert">{error}</p>}</div>;
}
