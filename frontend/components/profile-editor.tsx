"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/backend/supabase/client";

type Profile = { full_name: string; phone: string | null; purpose: string };

// Lets a client correct the contact details the TechJest team sees on their requests.
// The company is linked to a shared company record, so the team changes it on request.
export function ProfileEditor({ userId, profile }: { userId: string; profile: Profile }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [purpose, setPurpose] = useState(profile.purpose);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const { data, error } = await createClient()
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        purpose: purpose.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select("id");
    setSaving(false);
    if (error || !data?.length) {
      setMessage("Your details could not be saved. Please try again.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <div className="profile-actions">
        <button type="button" className="text-button" onClick={() => setOpen(true)}>
          Edit details
        </button>
        <Link className="text-button" href="/auth/reset">
          Change password
        </Link>
      </div>
    );
  }

  return (
    <form className="form profile-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="profile-name">Full name</label>
        <input
          id="profile-name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
        />
      </div>
      <div className="field">
        <label htmlFor="profile-phone">
          Phone <small>(optional)</small>
        </label>
        <input
          id="profile-phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          maxLength={30}
          autoComplete="tel"
        />
      </div>
      <div className="field">
        <label htmlFor="profile-purpose">What do you want to build?</label>
        <textarea
          id="profile-purpose"
          value={purpose}
          onChange={(event) => setPurpose(event.target.value)}
          required
          minLength={3}
          maxLength={500}
          rows={3}
        />
      </div>
      {message && (
        <p role="alert" className="form-message">
          {message}
        </p>
      )}
      <div className="profile-actions">
        <button className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save details"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
