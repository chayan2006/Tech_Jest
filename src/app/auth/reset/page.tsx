"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/backend/supabase/client";
import { getLoginDestination } from "@/lib/login-destination";

// Reached from the password-reset email (through /auth/callback, which signs the person in)
// or from the dashboard's "Change password" link.
export default function ResetPasswordPage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data }) => setSignedIn(Boolean(data.user)));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) {
      setMessage("The two passwords do not match.");
      return;
    }
    setBusy(true);
    setMessage("");
    const { data, error } = await createClient().auth.updateUser({ password });
    if (error) {
      setBusy(false);
      setMessage(
        /should be different/i.test(error.message)
          ? "Choose a password you have not used for this account before."
          : "Your password could not be changed. Request a new reset link and try again.",
      );
      return;
    }
    window.location.assign(getLoginDestination(data.user, "/dashboard"));
  }

  return (
    <section className="auth-hero">
      <div className="container auth-shell">
        <div className="eyebrow">Account security</div>
        <h1>Choose a new password.</h1>
        {signedIn === null ? (
          <p className="lead">Checking your reset link…</p>
        ) : signedIn ? (
          <>
            <p className="lead">Use at least 8 characters. You will stay signed in on this device.</p>
            <form className="form auth-form" onSubmit={submit}>
              <div className="field">
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="field">
                <label htmlFor="confirm-password">Confirm new password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              {message && (
                <p role="alert" className="form-message">
                  {message}
                </p>
              )}
              <button className="btn btn-primary" disabled={busy}>
                {busy ? "Saving…" : "Save new password"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="lead">This reset link has expired or was opened in a different browser.</p>
            <Link className="btn btn-primary" href="/auth?mode=forgot">
              Send a new reset link
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
