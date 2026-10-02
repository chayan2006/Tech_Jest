"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminUserActions({ userId, name }: { userId: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function removeUser() {
    if (!window.confirm(`Remove ${name}'s profile, requests, conversations, and notifications? This cannot be undone.`)) return;
    setBusy(true);
    const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      window.alert(result?.error || "Could not remove this user's data.");
      setBusy(false);
      return;
    }
    router.refresh();
    setBusy(false);
  }
  return <button type="button" className="request-delete" onClick={removeUser} disabled={busy}>{busy ? "Removing..." : "Remove data"}</button>;
}
