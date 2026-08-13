import { defineConfig, devices } from "@playwright/test";

const e2eUrl = "http://127.0.0.1:3400";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: e2eUrl,
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm start --port 3400",
    env: {
      ...process.env,
      BETTER_AUTH_URL: e2eUrl,
      NEXT_PUBLIC_APP_URL: e2eUrl,
    },
    url: `${e2eUrl}/api/health`,
    reuseExistingServer: false,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],
});
