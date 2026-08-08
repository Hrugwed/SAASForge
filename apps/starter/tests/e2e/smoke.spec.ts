import { expect, test } from "@playwright/test";

test("marketing, account lifecycle, and dashboard protection", async ({
  page,
}, testInfo) => {
  const project = testInfo.project.name.replace(/[^a-z0-9]/gi, "-");
  const email = `e2e-${project}-${Date.now()}@example.com`;
  const password = "Factory-test-password-2026";

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "production SaaS",
  );

  await page.getByRole("link", { name: "Explore the starter" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Welcome back",
  );

  await page.getByRole("link", { name: "Create one" }).click();
  await page.getByLabel("Name").fill("Factory Test");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create secure account" }).click();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Good morning, Factory",
  );
  await expect(page.getByText("Factory Test's workspace")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in$/);
});
