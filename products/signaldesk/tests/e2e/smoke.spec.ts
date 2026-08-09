import { expect, test } from "@playwright/test";

test("generated product exposes its independent product surface", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Turn scattered customer feedback into clear, prioritized product decisions.",
  );
  await expect(
    page.getByText("SignalDesk", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "Privacy" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Privacy policy" }),
  ).toBeVisible();
});
