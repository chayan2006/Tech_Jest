"use client";

import { FormEvent, useState } from "react";
import { useEffect } from "react";
import { createClient } from "@/backend/supabase/client";

type Mode = "login" | "signup";

function safeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function getLoginDestination(user: unknown, next: string | null) {
  const requestedPath = safeNextPath(next);
  const metadata = typeof user === "object" && user !== null && "app_metadata" in user
    ? user.app_metadata
    : null;
  const role = typeof metadata === "object" && metadata !== null && "role" in metadata ? metadata.role : null;
  return role === "admin" && requestedPath === "/dashboard" ? "/admin" : requestedPath;
}

function friendlyAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("rate limit") || normalized.includes("email rate")) {
    return "Supabase has temporarily limited confirmation emails. Wait a few minutes, then try again, or use the confirmation email already sent.";
  }
  if (normalized.includes("user already registered")) {
    return "This email already has an account. Switch to Log in instead.";
  }
  return message.replace("Invalid login credentials", "Email or password is incorrect.");
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (error === "oauth_callback") setMessage("Your sign-in link expired or could not be verified. Please try again.");
    if (error === "profile_setup") setMessage("Your account was created, but workspace setup failed. Please log in again.");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          data: { full_name: fullName.trim(), company: company.trim(), phone: phone.trim(), purpose: purpose.trim() },
        },
      });
    setBusy(false);
    if (result.error) {
      setMessage(friendlyAuthError(result.error.message));
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setMessage("Account created. Check your email to confirm your account, then log in.");
      setMode("login");
      return;
    }
    if (mode === "login" && result.data.user) {
      await supabase.from("audit_logs").insert({ user_id: result.data.user.id, event: "login", email: result.data.user.email });
    } else if (mode === "signup" && result.data.user) {
      await supabase.from("audit_logs").insert({ user_id: result.data.user.id, event: "signup", email: result.data.user.email });
    }
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.assign(getLoginDestination(result.data.user ?? {}, next));
  }

  async function signInWithGoogle() {
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) {
      setBusy(false);
      setMessage(error.message);
    }
  }

  function switchMode() {
    setMessage("");
    setMode(mode === "login" ? "signup" : "login");
  }

  return <section className="page-hero"><div className="container auth-shell">
    <div className="eyebrow">{mode === "login" ? "Client portal" : "Create your workspace"}</div>
    <h1>{mode === "login" ? "Welcome back." : "Let’s get to know your project."}</h1>
    <p className="lead">{mode === "login" ? "Log in to see your requests, account details, and project history." : "Create an account so your details, requests, and conversations stay organized in one private workspace."}</p>
    {mode === "login" && <><button className="btn btn-google" type="button" onClick={signInWithGoogle} disabled={busy}><span aria-hidden="true">G</span> Continue with Google</button><div className="auth-divider"><span>or use email</span></div></>}
    <form className="form auth-form" onSubmit={submit}>
      {mode === "signup" && <div className="auth-fields">
        <div className="field"><label htmlFor="full-name">Full name</label><input id="full-name" value={fullName} onChange={event=>setFullName(event.target.value)} required minLength={2} autoComplete="name" /></div>
        <div className="field"><label htmlFor="company">Company <small>(optional)</small></label><input id="company" value={company} onChange={event=>setCompany(event.target.value)} autoComplete="organization" /></div>
        <div className="field"><label htmlFor="phone">Phone <small>(optional)</small></label><input id="phone" type="tel" value={phone} onChange={event=>setPhone(event.target.value)} autoComplete="tel" /></div>
        <div className="field"><label htmlFor="purpose">What do you want to build?</label><textarea id="purpose" value={purpose} onChange={event=>setPurpose(event.target.value)} required minLength={3} rows={3} /></div>
      </div>}
      <div className="field"><label htmlFor="auth-email">Email</label><input id="auth-email" type="email" value={email} onChange={event=>setEmail(event.target.value)} required autoComplete="email" /></div>
      <div className="field"><label htmlFor="auth-password">Password</label><input id="auth-password" type="password" value={password} onChange={event=>setPassword(event.target.value)} required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} /><small>At least 8 characters.</small></div>
      {message&&<p role="alert" className="form-message">{message}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in to workspace" : "Create my workspace"}</button>
    </form>
    <button className="text-button" onClick={switchMode}>{mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}</button>
  </div></section>;
}
