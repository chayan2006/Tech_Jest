"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/backend/supabase/client";
import { statusOptions, type StatusKind } from "@/frontend/data/workflow";

// Where each kind of status is stored. Invoices have no updated_at column.
const targets: Record<StatusKind, { table: string; column: string; touch: boolean }> = {
  request: { table: "project_requests", column: "status", touch: true },
  lead: { table: "project_requests", column: "lead_stage", touch: true },
  proposal: { table: "proposals", column: "status", touch: true },
  project: { table: "projects", column: "status", touch: true },
  task: { table: "project_tasks", column: "status", touch: true },
  invoice: { table: "invoices", column: "status", touch: false },
  conversation: { table: "conversations", column: "status", touch: true },
};

export function AdminStatusSelect({
  kind,
  id,
  value,
  label = "Status",
  name,
}: {
  kind: StatusKind;
  id: string;
  value: string;
  label?: string;
  // Names the record for screen readers when several selects share a page.
  name?: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(value);
  const [serverValue, setServerValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Follow the saved value after a refresh, for example when a new message changes a conversation's status.
  if (value !== serverValue) {
    setServerValue(value);
    setCurrent(value);
  }

  async function update(next: string) {
    const { table, column, touch } = targets[kind];
    const patch: Record<string, string | null> = { [column]: next };
    if (touch) patch.updated_at = new Date().toISOString();
    if (kind === "invoice") patch.paid_at = next === "paid" ? new Date().toISOString() : null;
    setSaving(true);
    setError("");
    const { data, error: updateError } = await createClient().from(table).update(patch).eq("id", id).select("id");
    if (updateError || !data?.length) {
      setError("Could not update");
    } else {
      setCurrent(next);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <label className="admin-status-control">
      <span>{label}</span>
      <select
        value={current}
        onChange={(event) => update(event.target.value)}
        disabled={saving}
        aria-label={name ? `${label}: ${name}` : undefined}
      >
        {statusOptions[kind].map(([option, optionLabel]) => (
          <option key={option} value={option}>
            {optionLabel}
          </option>
        ))}
      </select>
      {error && <small role="alert">{error}</small>}
    </label>
  );
}
