"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Lets a client accept or decline a proposal the team has sent. The team is notified either way.
export function ProposalResponse({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function answer(accept: boolean) {
    if (!accept && !window.confirm("Decline this proposal? The team will be told, and you can still message them."))
      return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/proposals/${proposalId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(result?.error ?? "Your answer could not be saved. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("Could not reach TechJest. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="proposal-response">
      <div className="proposal-response-actions">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => answer(true)}>
          {busy ? "Saving…" : "Accept proposal"}
        </button>
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => answer(false)}>
          Decline
        </button>
      </div>
      {message && (
        <p className="form-message" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
