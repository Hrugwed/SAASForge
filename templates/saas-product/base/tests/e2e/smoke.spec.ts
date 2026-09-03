import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("generated product exposes its independent product surface", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "__PRODUCT_DESCRIPTION__",
  );
  await expect(
    page.getByText("__PRODUCT_NAME__", { exact: true }).first(),
  ).toBeVisible();
  const accessibilityScan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibilityScan.violations).toEqual([]);

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.getByRole("link", { name: "Privacy" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Privacy policy" }),
  ).toBeVisible();
});
