"use client";

import { FormEvent, useState } from "react";
import { useEffect } from "react";
import { createClient } from "@/backend/supabase/client";
import { getLoginDestination } from "@/lib/login-destination";
import { safeNextPath } from "@/lib/safe-next-path";

type Mode = "login" | "signup" | "forgot";

function requestedNextPath() {
  return safeNextPath(new URLSearchParams(window.location.search).get("next"));
}

function callbackUrl() {
  // Slashes stay readable so the default stays exactly "?next=/dashboard" for Supabase's redirect allow-list.
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(requestedNextPath()).replace(/%2F/gi, "/")}`;
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
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "forgot") setMode("forgot");
    const error = params.get("error");
    if (error === "oauth_callback") setMessage("Your sign-in link expired or could not be verified. Please try again.");
    if (error === "profile_setup")
      setMessage("Your account was created, but workspace setup failed. Please log in again.");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
      });
      setBusy(false);
      // The same reply whether or not the email has an account, so the form cannot be used to look up accounts.
      setMessage(
        error && /rate limit/i.test(error.message)
          ? friendlyAuthError(error.message)
          : "If an account uses that email, a link to choose a new password is on its way. Open it in this browser.",
      );
      return;
    }
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: callbackUrl(),
              data: {
                full_name: fullName.trim(),
                company: company.trim(),
                phone: phone.trim(),
                purpose: purpose.trim(),
              },
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
    // Sign-ins and sign-ups are added to the activity log by the database (record_auth_event).
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.assign(getLoginDestination(result.data.user ?? {}, next));
  }

  async function signInWithGoogle() {
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (error) {
      setBusy(false);
      setMessage(error.message);
    }
  }

  function switchMode(next: Mode) {
    setMessage("");
    setMode(next);
  }

  return (
    <section className="auth-hero">
      <div className="container auth-shell">
        <div className="eyebrow">
          {mode === "login" ? "Client portal" : mode === "signup" ? "Create your workspace" : "Account recovery"}
        </div>
        <h1>
          {mode === "login"
            ? "Welcome back."
            : mode === "signup"
              ? "Let’s get to know your project."
              : "Reset your password."}
        </h1>
        <p className="lead">
          {mode === "login"
            ? "Log in to see your requests, account details, and project history."
            : mode === "signup"
              ? "Create an account so your details, requests, and conversations stay organized in one private workspace."
              : "Enter the email you signed up with and we’ll send you a link to choose a new password."}
        </p>
        {mode !== "forgot" && (
          <>
            <button className="btn btn-google" type="button" onClick={signInWithGoogle} disabled={busy}>
              <span aria-hidden="true">G</span> Continue with Google
            </button>
            <div className="auth-divider">
              <span>or use email</span>
            </div>
          </>
        )}
        <form className="form auth-form" onSubmit={submit}>
          {mode === "signup" && (
            <div className="auth-fields">
              <div className="field">
                <label htmlFor="full-name">Full name</label>
                <input
                  id="full-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                />
              </div>
              <div className="field">
                <label htmlFor="company">
                  Company <small>(optional)</small>
                </label>
                <input
                  id="company"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  minLength={2}
                  maxLength={120}
                  autoComplete="organization"
                />
              </div>
              <div className="field">
                <label htmlFor="phone">
                  Phone <small>(optional)</small>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  maxLength={30}
                  autoComplete="tel"
                />
              </div>
              <div className="field">
                <label htmlFor="purpose">What do you want to build?</label>
                <textarea
                  id="purpose"
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  required
                  minLength={3}
                  maxLength={500}
                  rows={3}
                  aria-describedby="purpose-help"
                />
                <small id="purpose-help">
                  Up to 500 characters — you can share more detail in your project request.
                </small>
              </div>
            </div>
          )}
          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </div>
          {mode !== "forgot" && (
            <div className="field">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <small>At least 8 characters.</small>
              {mode === "login" && (
                <button type="button" className="text-button" onClick={() => switchMode("forgot")}>
                  Forgot your password?
                </button>
              )}
            </div>
          )}
          {message && (
            <p role="alert" className="form-message">
              {message}
            </p>
          )}
          <button className="btn btn-primary" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Log in to workspace"
                : mode === "signup"
                  ? "Create my workspace"
                  : "Send reset link"}
          </button>
        </form>
        <button type="button" className="text-button" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
          {mode === "login"
            ? "New here? Create an account"
            : mode === "signup"
              ? "Already have an account? Log in"
              : "Back to log in"}
        </button>
      </div>
    </section>
  );
}
