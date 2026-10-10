"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/backend/supabase/client";

type Setting = { key: string; value: string; label: string; description: string };

export function AdminSiteSettings({ settings }: { settings: Setting[] }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(settings.map((setting) => [setting.key, setting.value])),
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Your admin session has expired. Sign in again.");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("site_settings").upsert(
      settings.map((setting) => ({
        key: setting.key,
        value: values[setting.key]?.trim() ?? "",
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "key" },
    );
    setMessage(error ? "Could not save settings. Confirm the latest schema is applied." : "Website settings saved.");
    setSaving(false);
  }

  return (
    <form className="admin-form settings-form" onSubmit={save}>
      {settings.map((setting) => (
        <label key={setting.key}>
          {setting.label}
          <span className="admin-field-help">{setting.description}</span>
          <textarea
            value={values[setting.key] ?? ""}
            onChange={(event) => setValues((current) => ({ ...current, [setting.key]: event.target.value }))}
            rows={setting.key.includes("title") || setting.key.includes("description") ? 3 : 1}
            maxLength={1000}
          />
        </label>
      ))}
      <button className="btn btn-primary" disabled={saving}>
        {saving ? "Saving..." : "Save website settings"}
      </button>
      {message && (
        <p className="admin-message" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
