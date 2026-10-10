"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/backend/supabase/client";
import { documentsBucket } from "@/backend/supabase/documents";

// Removes a project task, or a project document together with its stored file.
export function AdminDeleteButton({
  kind,
  id,
  name,
  storagePath,
}: {
  kind: "task" | "document";
  id: string;
  name: string;
  storagePath?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    const consequence = kind === "document" ? " The client will no longer be able to download it." : "";
    if (!window.confirm(`Delete “${name}”?${consequence}`)) return;
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from(kind === "task" ? "project_tasks" : "project_documents")
      .delete()
      .eq("id", id)
      .select("id");
    if (error || !data?.length) {
      window.alert(`Could not delete this ${kind}.`);
      setBusy(false);
      return;
    }
    // The record goes first, so a failed file removal never leaves a broken download link.
    if (storagePath) await supabase.storage.from(documentsBucket).remove([storagePath]);
    router.refresh();
  }

  return (
    <button type="button" className="request-delete" onClick={remove} disabled={busy} aria-label={`Delete ${name}`}>
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
