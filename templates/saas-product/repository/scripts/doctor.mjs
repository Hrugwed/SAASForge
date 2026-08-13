import { spawnSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const checks = [];

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
      manifest.schemaVersion === 1 &&
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
      "Run pnpm setup; it never overwrites an existing environment.",
    );
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
