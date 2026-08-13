import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm start --port 3100",
    env: {
      ...process.env,
      APP_ENV: "test",
      AUTH_EMAIL_MODE: "local",
      AUTH_REQUIRE_EMAIL_VERIFICATION: "false",
      BETTER_AUTH_URL: "http://127.0.0.1:3100",
      NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3100",
    },
    url: "http://127.0.0.1:3100/api/health",
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
