import { spawnSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export function validateFactoryEnvironment(contents) {
  const values = new Map();
  for (const line of contents.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) throw new Error("Generated environment is malformed.");
    const key = line.slice(0, separator);
    if (values.has(key))
      throw new Error(`Generated environment repeats ${key}.`);
    values.set(key, line.slice(separator + 1));
  }

  const secret = values.get("BETTER_AUTH_SECRET") ?? "";
  if (
    secret.length < 32 ||
    secret === "replace-with-at-least-32-random-characters"
  ) {
    throw new Error("Factory setup did not generate a private auth secret.");
  }
  if (values.get("SAASFORGE_LOCAL_OPERATOR_MODE") !== "enabled") {
    throw new Error("Factory setup did not enable loopback operator mode.");
  }
  if (values.get("NEXT_PUBLIC_APP_URL") !== "http://localhost:3000") {
    throw new Error("Factory setup changed the local public URL.");
  }
  if (values.get("BETTER_AUTH_URL") !== "http://localhost:3000") {
    throw new Error("Factory setup changed the local auth URL.");
  }

  const databaseUrl = new URL(values.get("DATABASE_URL") ?? "");
  if (!new Set(["postgres:", "postgresql:"]).has(databaseUrl.protocol)) {
    throw new Error("Factory setup did not preserve a PostgreSQL URL.");
  }
}

function runSetup(targetRoot) {
  const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const result = spawnSync(
    command,
    ["factory:setup", "--", "--root", targetRoot],
    {
      cwd: repositoryRoot,
      shell: process.platform === "win32",
      stdio: "inherit",
      windowsHide: true,
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Factory setup exited with code ${result.status ?? 1}.`);
  }
}

export async function smokeFactorySetup(root = repositoryRoot) {
  const environmentPath = path.join(root, "apps", "factory", ".env.local");
  await access(environmentPath).then(
    () => {
      throw new Error(
        "Setup smoke requires a clean checkout without .env.local.",
      );
    },
    () => undefined,
  );

  runSetup(root);
  const first = await readFile(environmentPath, "utf8");
  validateFactoryEnvironment(first);

  runSetup(root);
  const second = await readFile(environmentPath, "utf8");
  if (second !== first) {
    throw new Error("A repeated factory setup changed the local environment.");
  }

  console.log("Factory setup created valid private config and is idempotent.");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const rootOption = process.argv.indexOf("--root");
  const targetRoot =
    rootOption >= 0 && process.argv[rootOption + 1]
      ? path.resolve(process.argv[rootOption + 1])
      : repositoryRoot;
  smokeFactorySetup(targetRoot).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
