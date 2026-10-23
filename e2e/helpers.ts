import { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.E2E_SUPABASE_URL!;
const publishableKey = process.env.E2E_SUPABASE_PUBLISHABLE_KEY!;

// Service-role client for setting up and checking data in the local test database.
export const admin = createClient(url, process.env.E2E_SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

// A fresh client with no session, as a visitor or a signed-in user would have.
export function browserlessClient() {
  return createClient(url, publishableKey, { auth: { persistSession: false } });
}

let counter = 0;
export function uniqueEmail(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@example.test`;
}

export async function createUser(options: { prefix: string; role?: "admin"; name?: string; password?: string }) {
  const email = uniqueEmail(options.prefix);
  const password = options.password ?? "TestPass123";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: options.role ? { role: options.role } : {},
    user_metadata: { full_name: options.name ?? "Test Person", purpose: "Testing the site" },
  });
  if (error) throw error;
  return { id: data.user.id, email, password };
}

// A supabase-js client signed in as the given user.
export async function signedInClient(email: string, password: string) {
  const client = browserlessClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

export async function logIn(page: Page, email: string, password: string) {
  await page.goto("/auth");
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill(password);
  await page.getByRole("button", { name: "Log in to workspace" }).click();
  await page.waitForURL((current) => !current.pathname.startsWith("/auth"));
}

export async function logInAsAdmin(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.locator("#admin-email").fill(email);
  await page.locator("#admin-password").fill(password);
  await page.getByRole("button", { name: "Log in as admin" }).click();
  await page.waitForURL("**/admin");
}

// The newest link in the local mail catcher's copy of an email sent to this address.
export async function latestEmailLink(to: string): Promise<string> {
  const mailpit = process.env.E2E_MAILPIT_URL!;
  let link: string | undefined;
  await expect
    .poll(
      async () => {
        const list = await (await fetch(`${mailpit}/api/v1/search?query=to:${encodeURIComponent(to)}`)).json();
        const id = list.messages?.[0]?.ID;
        if (!id) return undefined;
        const message = await (await fetch(`${mailpit}/api/v1/message/${id}`)).json();
        link = /href="([^"]+)"/.exec(message.HTML ?? message.Text ?? "")?.[1]?.replace(/&amp;/g, "&");
        return link;
      },
      { timeout: 15_000 },
    )
    .toBeTruthy();
  return link!;
}

// Fails if the page is wider than the screen (sideways scrolling on phones).
export async function expectNoSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}
