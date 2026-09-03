import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectGeneratedPaths(
  page: Page,
  paths: readonly string[],
): Promise<void> {
  const repository = page.getByLabel("Generated repository tree");

  for (const path of paths) {
    await expect(
      repository.getByRole("listitem").filter({ hasText: path }),
    ).toHaveCount(1);
  }
}

test("public landing explains and demonstrates the factory accessibly", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();

  const hero = page.getByRole("heading", { level: 1 });
  await expect(hero).toHaveCount(1);
  await expect(hero).toContainText("Start with the idea");
  await expect(
    page.getByText("Locally validated", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open private factory" }).first(),
  ).toHaveAttribute("href", "/dashboard");
  const accessibilityScan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibilityScan.violations).toEqual([]);

  const forgeCore = page.getByTestId("forge-core");
  await expect(forgeCore).toHaveAttribute("data-motion", "reduced");
  const initialCoreStyle = await forgeCore.getAttribute("style");
  await forgeCore.hover({ position: { x: 24, y: 24 } });
  await expect(forgeCore).toHaveAttribute("data-motion", "reduced");
  expect(await forgeCore.getAttribute("style")).toBe(initialCoreStyle);

  if (testInfo.project.name === "mobile-chrome") {
    const mobileMenu = page.locator("details").first();
    await page.getByText("Menu", { exact: true }).click();
    await expect(mobileMenu).toHaveAttribute("open", "");
    await mobileMenu
      .getByRole("link", { name: "Blueprint", exact: true })
      .click();
    await expect(mobileMenu).not.toHaveAttribute("open");
  } else {
    await page.getByRole("link", { name: "Blueprint", exact: true }).click();
  }
  await expect(page).toHaveURL(/#blueprint$/);
  await expect(
    page.getByRole("heading", { name: /One blueprint in/i }),
  ).toBeVisible();

  const identity = page.getByRole("button", { name: /Identity/i });
  const billing = page.getByRole("button", { name: /Billing/i });
  await expect(identity).toHaveAttribute("aria-pressed", "true");
  await expect(billing).toHaveAttribute("aria-pressed", "false");
  await expectGeneratedPaths(page, [
    "apps/web/package.json",
    "apps/web/src/app/page.tsx",
    "apps/web/.env.example",
    "docs/deployment.md",
    "scripts/doctor.mjs",
    "tooling/security/license-check.mjs",
    "apps/web/src/lib/auth.ts",
    "packages/auth/src/index.ts",
  ]);

  await billing.focus();
  await page.keyboard.press("Enter");
  await expect(billing).toHaveAttribute("aria-pressed", "true");
  await expect(identity).toHaveAttribute("aria-pressed", "true");
  await expectGeneratedPaths(page, [
    "apps/web/src/app/api/billing/webhook/route.ts",
    "packages/billing/src/entitlements.ts",
  ]);
  await expect(page.getByText(/--modules "auth,billing"/)).toBeVisible();

  await identity.focus();
  await page.keyboard.press("Space");
  await expect(identity).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[aria-live="polite"]')).toContainText(
    "Identity stays selected",
  );

  await billing.click();
  await identity.focus();
  await page.keyboard.press("Space");
  await expect(identity).toHaveAttribute("aria-pressed", "false");

  const jobs = page.getByRole("button", { name: /Jobs/i });
  await jobs.click();
  await expect(jobs).toHaveAttribute("aria-pressed", "true");
  await expect(identity).toHaveAttribute("aria-pressed", "true");
  await expectGeneratedPaths(page, [
    "apps/web/src/app/api/inngest/route.ts",
    "packages/jobs/src/index.ts",
  ]);

  await jobs.click();
  await identity.click();
  await expect(identity).toHaveAttribute("aria-pressed", "false");

  const storage = page.getByRole("button", { name: /Storage/i });
  await storage.click();
  await expect(storage).toHaveAttribute("aria-pressed", "true");
  await expect(identity).toHaveAttribute("aria-pressed", "true");
  await expectGeneratedPaths(page, [
    "apps/web/src/app/api/storage/upload/route.ts",
    "packages/storage/src/index.ts",
  ]);

  await storage.click();
  await identity.click();
  await expect(identity).toHaveAttribute("aria-pressed", "false");

  const email = page.getByRole("button", { name: /Email/i });
  const analytics = page.getByRole("button", { name: /Analytics/i });
  await email.click();
  await analytics.click();
  await expectGeneratedPaths(page, [
    "apps/web/src/lib/email.ts",
    "packages/email/src/index.ts",
    "apps/web/src/lib/analytics.ts",
    "packages/analytics/src/index.ts",
  ]);

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      ),
    )
    .toBe("auto");

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in$/);
});
