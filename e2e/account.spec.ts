import { expect, test } from "@playwright/test";
import { createUser, expectNoSidewaysScroll, latestEmailLink, logIn, uniqueEmail } from "./helpers";

test("a visitor signs up and lands in their workspace", async ({ page }) => {
  await page.goto("/auth");
  await page.getByRole("button", { name: "New here? Create an account" }).click();
  // Google sign-in is offered on the sign-up screen too.
  await expect(page.getByRole("button", { name: /Continue with Google/ })).toBeVisible();
  await page.locator("#full-name").fill("Tester Person");
  await page.locator("#company").fill("Tester Labs");
  await page.locator("#purpose").fill("A customer portal");
  await page.locator("#auth-email").fill(uniqueEmail("signup"));
  await page.locator("#auth-password").fill("FirstPass123");
  await page.getByRole("button", { name: "Create my workspace" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Good to see you, Tester." })).toBeVisible();
});

test("a client edits their contact details", async ({ page }) => {
  const user = await createUser({ prefix: "profile", name: "Pat Client" });
  await logIn(page, user.email, user.password);
  await page.getByRole("button", { name: "Edit details" }).click();
  await page.locator("#profile-phone").fill("+91 98765 43210");
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.locator(".profile-summary")).toContainText("+91 98765 43210");
});

test("a client resets a forgotten password by email", async ({ page }) => {
  const user = await createUser({ prefix: "reset", password: "FirstPass123" });
  await page.goto("/auth?mode=forgot");
  await expect(page.getByRole("heading", { name: "Reset your password." })).toBeVisible();
  await page.locator("#auth-email").fill(user.email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.locator(".form-message")).toContainText("If an account uses that email");

  // The link must be opened in the browser that asked for it.
  await page.goto(await latestEmailLink(user.email));
  await expect(page).toHaveURL(/\/auth\/reset$/);
  await page.locator("#new-password").fill("SecondPass456");
  await page.locator("#confirm-password").fill("Mismatch999");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.locator(".form-message")).toContainText("do not match");
  await page.locator("#confirm-password").fill("SecondPass456");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("button", { name: "Log out" }).click();
  await page.goto("/auth");
  await page.locator("#auth-email").fill(user.email);
  await page.locator("#auth-password").fill("FirstPass123");
  await page.getByRole("button", { name: "Log in to workspace" }).click();
  await expect(page.locator(".form-message")).toContainText("Email or password is incorrect");
  await page.locator("#auth-password").fill("SecondPass456");
  await page.getByRole("button", { name: "Log in to workspace" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("the reset page without a valid link offers a new one", async ({ page }) => {
  await page.goto("/auth/reset");
  await expect(page.getByRole("link", { name: "Send a new reset link" })).toBeVisible();
});

test("the workspace fits a phone screen", async ({ page }) => {
  const user = await createUser({ prefix: "phone" });
  await page.setViewportSize({ width: 375, height: 800 });
  await logIn(page, user.email, user.password);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expectNoSidewaysScroll(page);
});
