"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/backend/supabase/client";
import { documentsBucket } from "@/backend/supabase/documents";

const maxBytes = 10 * 1024 * 1024;

export function AdminDocumentUpload({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    if (file.size > maxBytes) {
      setMessage("Files must be 10 MB or smaller.");
      return;
    }
    setSaving(true);
    setMessage("");
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120) || "document";
    // The first folder is the project id; storage policies use it to decide which client may read the file.
    const path = `${projectId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(documentsBucket).upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (uploadError) {
      setMessage("Could not upload the file. Confirm the project-documents storage bucket exists.");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("project_documents").insert({ project_id: projectId, name: (name.trim() || file.name).slice(0, 200), storage_path: path });
    if (error) {
      await supabase.storage.from(documentsBucket).remove([path]);
      setMessage("Could not save the document record.");
    } else {
      setFile(null);
      setName("");
      setInputKey(key => key + 1);
      setMessage("Document uploaded. The client can download it from their project page.");
      router.refresh();
    }
    setSaving(false);
  }

  return <form className="admin-form" onSubmit={submit}>
    <label>File<input key={inputKey} type="file" onChange={event => setFile(event.target.files?.[0] ?? null)} required /></label>
    <label>Display name <span className="admin-field-help">Optional — defaults to the file name.</span><input value={name} onChange={event => setName(event.target.value)} maxLength={200} /></label>
    <button className="btn btn-primary" disabled={saving || !file}>{saving ? "Uploading..." : "Upload document"}</button>
    {message && <p className="admin-message" role="status">{message}</p>}
  </form>;
}
