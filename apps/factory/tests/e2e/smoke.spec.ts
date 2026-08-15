import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
}

async function navigateFactory(
  page: Page,
  projectName: string,
  destination: "Products" | "Modules",
  workspaceName?: string,
): Promise<void> {
  if (projectName === "mobile-chrome") {
    const mobileNavigation = page.locator("details.dashboard-mobile-nav");
    await mobileNavigation.getByText("Navigate", { exact: true }).click();
    await expect(mobileNavigation).toHaveAttribute("open", "");
    if (workspaceName) {
      await expect(mobileNavigation.getByText(workspaceName)).toBeVisible();
    }
    await mobileNavigation
      .getByRole("link", { name: destination, exact: true })
      .click();
    await expect(mobileNavigation).not.toHaveAttribute("open");
    return;
  }

  await page.getByRole("link", { name: destination, exact: true }).click();
}

test("private factory access, module visibility, and dashboard protection", async ({
  page,
}, testInfo) => {
  const project = testInfo.project.name.replace(/[^a-z0-9]/gi, "-");
  const email = `e2e-${project}-${Date.now()}@example.com`;
  const password = "Factory-test-password-2026";

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Start with the idea",
  );

  await page
    .getByRole("link", { name: "Open private factory" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Return to the work",
  );
  await expect(page.getByText("Authenticate your session.")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const signInPassword = page.getByLabel("Password", { exact: true });
  await expect(signInPassword).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(signInPassword).toHaveAttribute("type", "text");

  await page.getByRole("link", { name: "Create one" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Build from a clean boundary",
  );
  await expectNoHorizontalOverflow(page);
  await page.getByLabel("Name").fill("Factory Test");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create secure account" }).click();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Good morning, Factory",
  );
  if (testInfo.project.name === "chromium") {
    await expect(
      page
        .locator(".dashboard-sidebar > .sidebar-footer")
        .getByText("Factory Test's workspace"),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("region", { name: "Factory snapshot" }),
  ).toContainText("Evidence scope");
  await expectNoHorizontalOverflow(page);

  await navigateFactory(
    page,
    testInfo.project.name,
    "Products",
    "Factory Test's workspace",
  );
  await expect(page).toHaveURL(/\/dashboard\/products$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Independent products",
  );
  await expect(
    page
      .getByText("GENERATOR STANDING BY")
      .or(page.getByRole("region", { name: "Generated products" })),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await navigateFactory(page, testInfo.project.name, "Modules");
  await expect(page).toHaveURL(/\/dashboard\/modules$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Six capabilities",
  );
  await expect(page.getByText("packages/jobs")).toBeVisible();
  await expect(page.getByText("packages/storage")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("link", { name: "Inspect capability →" }).click();
  await expect(page).toHaveURL(/\/dashboard\/modules\/billing$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "A hardened billing boundary",
  );
  await expect(page.getByText("NOT CONNECTED")).toBeVisible();
  await expect(
    page.getByText("Exact raw-body Stripe signature verification"),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in$/);
});
