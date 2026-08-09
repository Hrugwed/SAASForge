import { expect, test } from "@playwright/test";

test("customer can create an account and use the protected workspace", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Create one" }).click();
  await page.getByLabel("Name").fill("Factory Test");
  await page.getByLabel("Email").fill(`factory-${Date.now()}@example.test`);
  await page.getByLabel("Password").fill("Factory-test-password-2026");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", {
      name: "Build the core customer outcome here.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Ready", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in$/);
});
