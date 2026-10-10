"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/backend/supabase/client";

export function AdminTaskForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const { error } = await createClient()
      .from("project_tasks")
      .insert({
        project_id: projectId,
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
      });
    if (error) {
      setMessage("Could not save the task.");
    } else {
      setTitle("");
      setDescription("");
      setDueDate("");
      setMessage("Task added. The client sees it on their project page.");
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <label>
        Task title
        <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={200} />
      </label>
      <label>
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          maxLength={2000}
        />
      </label>
      <label>
        Due date
        <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
      </label>
      <button className="btn btn-primary" disabled={saving}>
        {saving ? "Adding..." : "Add task"}
      </button>
      {message && (
        <p className="admin-message" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
