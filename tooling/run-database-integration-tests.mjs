import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const environment = await readFile(
    path.join(root, "apps", "factory", ".env.local"),
    "utf8",
  );
  const match = environment.match(/^DATABASE_URL=(.+)$/m);
  if (!match?.[1]) {
    throw new Error(
      "DATABASE_URL is required. Run npm run factory:bootstrap before integration tests.",
    );
  }
  return match[1].trim().replace(/^(['"])(.*)\1$/, "$2");
}

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const child = spawn(
  command,
  [
    "--filter",
    "@saasforge/auth",
    "--filter",
    "@saasforge/billing",
    "run",
    "test:integration",
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      DATABASE_URL: await databaseUrl(),
      REQUIRE_DATABASE_INTEGRATION: "1",
    },
    shell: process.platform === "win32",
    stdio: "inherit",
    windowsHide: true,
  },
);

child.once("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.once("exit", (code) => {
  process.exitCode = code ?? 1;
});
