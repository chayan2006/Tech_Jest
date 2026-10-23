import { getSiteUrl } from "@/lib/site-url";

type RequestAlert = {
  requestId: string;
  guest: boolean;
  service: string;
  message: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  budget?: string | null;
  timeline?: string | null;
};

type Email = { subject: string; text: string; replyTo?: string };

const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

// Plain text only, so nothing a client types can turn into HTML in the team's inbox.
export function requestAlertEmail(alert: RequestAlert): Email {
  const who = alert.name || alert.email || "A client";
  const details: [string, string | null | undefined][] = [
    ["Service", alert.service],
    ["Name", alert.name],
    ["Email", alert.email],
    ["Phone", alert.phone],
    ["Company", alert.company],
    ["Budget", alert.budget],
    ["Timeline", alert.timeline],
  ];
  const text = [
    alert.guest
      ? "A visitor sent an enquiry without an account. Reply to this email to answer them."
      : "A signed-in client sent a project request. Reply in the admin console so it stays in their workspace.",
    "",
    ...details.filter(([, value]) => value).map(([label, value]) => `${label}: ${oneLine(String(value))}`),
    "",
    "Message:",
    alert.message,
    "",
    `Open in the admin console: ${getSiteUrl()}/admin/requests/${alert.requestId}`,
  ].join("\n");
  return {
    subject: oneLine(
      `${alert.guest ? "New guest enquiry" : "New project request"}: ${alert.service} from ${who}`,
    ).slice(0, 200),
    text,
    replyTo: alert.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(alert.email) ? alert.email : undefined,
  };
}

// A short alert for the team about something a client did, with a link to where to act on it.
export function teamNoticeEmail(subject: string, lines: string[], adminPath: string, replyTo?: string | null): Email {
  return {
    subject: oneLine(subject).slice(0, 200),
    text: [...lines, "", `Open in the admin console: ${getSiteUrl()}${adminPath}`].join("\n"),
    replyTo: replyTo && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(replyTo) ? replyTo : undefined,
  };
}

const defaultSender = "TechJest alerts <onboarding@resend.dev>";

async function sendEmail(to: string[], email: Email, from: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject: email.subject,
        text: email.text,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      console.error("Email was not sent", { status: response.status, detail: (await response.text()).slice(0, 300) });
  } catch (error) {
    console.error("Email was not sent", error);
  }
}

let warnedOff = false;

// Sends through Resend (https://resend.com). Off until RESEND_API_KEY and ALERT_EMAIL_TO are set.
// A failed alert is logged, never shown to the client: their request is already saved.
export async function sendTeamAlert(email: Email): Promise<void> {
  const to = (process.env.ALERT_EMAIL_TO ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  if (!process.env.RESEND_API_KEY?.trim() || !to.length) {
    if (!warnedOff) console.warn("Email alerts are off: set RESEND_API_KEY and ALERT_EMAIL_TO to turn them on.");
    warnedOff = true;
    return;
  }
  await sendEmail(to, email, process.env.ALERT_EMAIL_FROM?.trim() || defaultSender);
}

// Emails a client (for example when the team replies). Resend's shared test sender can only email the
// Resend account's own address, so client emails stay off until ALERT_EMAIL_FROM is an address on a
// domain verified in Resend.
function clientEmailsEnabled() {
  const from = process.env.ALERT_EMAIL_FROM?.trim() ?? "";
  return Boolean(process.env.RESEND_API_KEY?.trim() && from && !from.includes("resend.dev"));
}

export async function sendClientEmail(to: string, email: Email): Promise<void> {
  if (!clientEmailsEnabled() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return;
  await sendEmail([to], email, process.env.ALERT_EMAIL_FROM!.trim());
}
