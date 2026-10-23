import { expect, test } from "@playwright/test";
import { admin, browserlessClient, createUser, expectNoSidewaysScroll, logInAsAdmin, uniqueEmail } from "./helpers";

test("admin sign-in is recorded and the console shows one notification bell", async ({ page }) => {
  const team = await createUser({ prefix: "admin-login", role: "admin" });
  await logInAsAdmin(page, team.email, team.password);
  await expect(page.locator(".message-notification")).toHaveCount(1);
  const { data } = await admin.from("audit_logs").select("event").eq("email", team.email);
  expect(data?.map((row) => row.event)).toContain("admin_login");
});

test("a broken request link shows not found, not a database error", async ({ page }) => {
  const team = await createUser({ prefix: "admin-404", role: "admin" });
  await logInAsAdmin(page, team.email, team.password);
  const response = await page.goto("/admin/requests/not-a-uuid");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("invalid input syntax")).toHaveCount(0);
});

test("the service editor keeps new lines and commas while typing", async ({ page }) => {
  const team = await createUser({ prefix: "admin-services", role: "admin" });
  await logInAsAdmin(page, team.email, team.password);
  await page.goto("/admin/services");
  const row = page.locator(".admin-service-row").first();
  const slug = (await row.locator("small").first().innerText()).replace("/", "");
  await row.getByRole("button", { name: "Edit service" }).click();

  const included = row.getByLabel(/Included deliverables/);
  await included.evaluate((element: HTMLTextAreaElement) =>
    element.setSelectionRange(element.value.length, element.value.length),
  );
  await included.press("Enter");
  await included.pressSequentially("Typed new item");
  await expect(included).toHaveValue(/\nTyped new item$/);

  const technologies = row.getByLabel(/Technologies/);
  await technologies.evaluate((element: HTMLTextAreaElement) =>
    element.setSelectionRange(element.value.length, element.value.length),
  );
  await technologies.pressSequentially(", Rust");
  await expect(technologies).toHaveValue(/, Rust$/);

  await row.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("saved to the live catalog")).toBeVisible();
  const { data } = await admin.from("service_catalog").select("included, technologies").eq("slug", slug).single();
  expect(data?.included.at(-1)).toBe("Typed new item");
  expect(data?.technologies.at(-1)).toBe("Rust");
});

test("a new service cannot take an existing service's slug", async ({ page }) => {
  const team = await createUser({ prefix: "admin-slug", role: "admin" });
  const { data: existing } = await admin.from("service_catalog").select("slug, name").limit(1).single();
  await logInAsAdmin(page, team.email, team.password);
  await page.goto("/admin/services");
  await page.getByRole("button", { name: "Add service" }).click();
  await page.locator("input[name=name]").fill("Impostor service");
  await page.locator("input[name=slug]").fill(existing!.slug);
  await page.locator("textarea[name=description]").fill("This should not replace anything at all.");
  await page.locator("input[name=delivery]").fill("1 week");
  await page.getByRole("button", { name: "Create service" }).click();
  await expect(page.getByText("is already used by another service")).toBeVisible();
  const { data: after } = await admin.from("service_catalog").select("name").eq("slug", existing!.slug).single();
  expect(after?.name).toBe(existing!.name);
});

test("long request lists are split into pages", async ({ page }) => {
  const client = await createUser({ prefix: "paged" });
  await admin.from("project_requests").insert(
    Array.from({ length: 30 }, (_, index) => ({
      user_id: client.id,
      service: `Paged request ${index}`,
      message: "x".repeat(25),
      email: client.email,
    })),
  );
  const { count } = await admin.from("project_requests").select("*", { count: "exact", head: true });
  const pages = Math.ceil(count! / 25);
  const team = await createUser({ prefix: "admin-pages", role: "admin" });
  await logInAsAdmin(page, team.email, team.password);

  await page.goto("/admin/requests");
  await expect(page.locator(".admin-request")).toHaveCount(25);
  await expect(page.locator(".admin-pagination")).toContainText(`Page 1 of ${pages}`);
  await expect(page.getByRole("link", { name: "Older →" })).toBeVisible();
  await page.goto(`/admin/requests?page=${pages}`);
  await expect(page.locator(".admin-request")).toHaveCount(count! - 25 * (pages - 1));
  await page.goto("/admin/requests?page=abc");
  await expect(page.locator(".admin-pagination")).toContainText("Page 1");
  await page.goto("/admin/users");
  await expect(page.locator(".admin-count")).toContainText(/\d+ people/);
});

test("a guest enquiry tells the team there is no account", async ({ page }) => {
  const { data: requestId, error } = await browserlessClient().rpc("submit_guest_request", {
    p_name: "Guest Person",
    p_email: uniqueEmail("guest-label"),
    p_message: "Please build us a booking website for our clinic.",
    p_service: "Web Development",
  });
  expect(error).toBeNull();
  const team = await createUser({ prefix: "admin-guest", role: "admin" });
  await logInAsAdmin(page, team.email, team.password);
  await page.goto(`/admin/requests/${requestId}`);
  await expect(page.getByText("Guest enquiry: this person has no account")).toBeVisible();
});

test("website settings show on the cached homepage straight away", async ({ page }) => {
  const team = await createUser({ prefix: "admin-settings", role: "admin" });
  await logInAsAdmin(page, team.email, team.password);
  const marker = `Trusted partner ${Date.now()}`;
  await page.goto("/admin/settings");
  await page.locator("form.settings-form textarea").first().fill(marker);
  await page.locator("form.settings-form").getByRole("button", { name: /Save/ }).click();
  await expect(page.getByText("The live site shows them now")).toBeVisible();
  await expect.poll(async () => (await (await page.request.get("/")).text()).includes(marker)).toBe(true);
});

test("every admin page loads and fits a phone screen", async ({ page }) => {
  const team = await createUser({ prefix: "admin-phone", role: "admin" });
  await logInAsAdmin(page, team.email, team.password);
  await page.setViewportSize({ width: 375, height: 800 });
  for (const path of [
    "/admin",
    "/admin/requests",
    "/admin/crm",
    "/admin/proposals",
    "/admin/projects",
    "/admin/invoices",
    "/admin/messages",
    "/admin/notifications",
    "/admin/users",
    "/admin/activity",
    "/admin/services",
    "/admin/settings",
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expectNoSidewaysScroll(page);
  }
});
