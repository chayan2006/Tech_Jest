"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/backend/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (result.error || !result.data.user) {
      await supabase.auth.signOut();
      setBusy(false);
      setMessage(result.error?.message ?? "Could not sign in. Check the email and password.");
      return;
    }
    if (result.data.user.app_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      setBusy(false);
      setMessage("This account does not have admin access. Clients can log in from the Login page.");
      return;
    }

    await supabase
      .from("audit_logs")
      .insert({ user_id: result.data.user.id, event: "admin_login", email: result.data.user.email });
    window.location.assign("/admin");
  }

  return (
    <section className="auth-hero">
      <div className="container auth-shell admin-login-page">
        <div className="eyebrow">Restricted access</div>
        <h1>Admin login.</h1>
        <p className="lead">Sign in with an authorized TechJest administrator account.</p>
        <form className="form auth-form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="admin-email">Admin email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {message && (
            <p role="alert" className="form-message">
              {message}
            </p>
          )}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Checking access…" : "Log in as admin"}
          </button>
        </form>
      </div>
    </section>
  );
}
