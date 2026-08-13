import { spawnSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const checks = [];
const productionMode = process.argv.includes("--production");

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function add(status, message, remediation) {
  checks.push({ status, message, remediation });
}

function parseEnvironment(source) {
  const environment = {};
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    environment[trimmed.slice(0, separator)] = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, "$2");
  }
  return environment;
}

function isPlaceholder(value) {
  return !value || /replace|example\.com|change-me|your[-_]/i.test(value);
}

const [major = 0, minor = 0] = process.version
  .replace(/^v/, "")
  .split(".")
  .map(Number);
const nodeSupported = major > 22 || (major === 22 && minor >= 14);
add(
  nodeSupported ? "pass" : "fail",
  `Node ${process.version} ${nodeSupported ? "is supported" : "is unsupported"}.`,
  "Install Node 22.14 or newer.",
);

const pnpm = spawnSync("pnpm", ["--version"], {
  shell: process.platform === "win32",
  stdio: "ignore",
  timeout: 10_000,
});
add(
  pnpm.status === 0 ? "pass" : "fail",
  "pnpm availability check completed.",
  "Enable Corepack or install pnpm.",
);

const manifestPath = path.join(root, "saasforge.manifest.json");
if (!(await exists(manifestPath))) {
  add(
    "fail",
    "saasforge.manifest.json is missing.",
    "Restore the generated manifest before structural changes.",
  );
} else {
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const valid =
      [1, 2].includes(manifest.schemaVersion) &&
      manifest.outputMode === "standalone" &&
      manifest.ownership?.application === "apps/web";
    add(
      valid ? "pass" : "fail",
      `Product manifest ${valid ? "is valid" : "is unsupported"}.`,
    );
    const app = manifest.ownership?.application;
    add(
      app && (await exists(path.join(root, app, "package.json")))
        ? "pass"
        : "fail",
      "Owned application package check completed.",
      "Restore apps/web or correct the manifest through a supported upgrade.",
    );
    const environmentPath = path.join(
      root,
      manifest.ownership?.environment ?? "apps/web/.env.local",
    );
    const environmentExists = await exists(environmentPath);
    add(
      environmentExists ? "pass" : "warn",
      environmentExists
        ? "Local environment is present."
        : "Local environment is not configured.",
      "Run pnpm product:setup; it never overwrites an existing environment.",
    );
    if (environmentExists) {
      const environment = parseEnvironment(
        await readFile(environmentPath, "utf8"),
      );
      const required = new Set([
        "NEXT_PUBLIC_APP_URL",
        "APP_ENV",
        "SENTRY_DSN",
      ]);
      const modules = new Set(manifest.product?.modules ?? []);
      if (modules.has("auth")) {
        required.add("DATABASE_URL");
        required.add("BETTER_AUTH_SECRET");
        required.add("BETTER_AUTH_URL");
      }
      if (modules.has("billing")) {
        required.add("STRIPE_SECRET_KEY");
        required.add("STRIPE_WEBHOOK_SECRET");
        required.add("STRIPE_PRICE_DEFAULT");
        required.add("CRON_SECRET");
      }
      if (modules.has("email")) {
        required.add("RESEND_API_KEY");
        required.add("EMAIL_FROM");
      }
      if (modules.has("analytics")) {
        required.add("POSTHOG_API_KEY");
        required.add("POSTHOG_HOST");
      }
      if (modules.has("jobs")) {
        required.add("INNGEST_EVENT_KEY");
        required.add("INNGEST_SIGNING_KEY");
      }
      if (modules.has("storage")) {
        required.add("CLOUDFLARE_ACCOUNT_ID");
        required.add("R2_ACCESS_KEY_ID");
        required.add("R2_SECRET_ACCESS_KEY");
        required.add("R2_BUCKET");
      }
      const incomplete = [...required].filter((key) =>
        isPlaceholder(environment[key]),
      );
      add(
        incomplete.length === 0 ? "pass" : productionMode ? "fail" : "warn",
        incomplete.length === 0
          ? "Enabled capability environment is configured."
          : `Enabled capability environment is incomplete (${incomplete.join(", ")}).`,
        "Configure product-owned credentials; values are never printed by the doctor.",
      );
    }
  } catch {
    add(
      "fail",
      "Product manifest is not valid JSON.",
      "Restore it from the generation record.",
    );
  }
}

for (const check of checks) {
  console.log(`[${check.status.toUpperCase()}] ${check.message}`);
  if (check.remediation && check.status !== "pass") {
    console.log(`       ${check.remediation}`);
  }
}
if (checks.some((check) => check.status === "fail")) process.exitCode = 1;
