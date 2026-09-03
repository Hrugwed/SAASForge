import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const environmentPath = path.join(
  repositoryRoot,
  "apps",
  "factory",
  ".env.local",
);
const factoryHealthUrl = "http://127.0.0.1:3000/api/health";

export function assertSupportedNode(version) {
  const [major = 0, minor = 0] = version
    .replace(/^v/, "")
    .split(".")
    .map(Number);
  if (major !== 22 || minor < 14) {
    throw new Error(
      `Node ${version} is unsupported. Install Node >=22.14.0 <23.`,
    );
  }
}

export function databaseUrlFromPrismaOutput(output) {
  const match = output.match(/postgres(?:ql)?:\/\/[^\s]+/);
  if (!match) return null;
  const url = new URL(match[0]);
  url.pathname = "/saasforge";
  return url.toString();
}

export function setEnvironmentValue(contents, key, value) {
  const expression = new RegExp(`^${key}=.*$`, "m");
  if (!expression.test(contents)) {
    throw new Error(`Local environment is missing ${key}.`);
  }
  return contents.replace(expression, `${key}=${value}`);
}

export function isFactoryHealth(payload) {
  return Boolean(
    payload &&
    typeof payload === "object" &&
    payload.status === "ok" &&
    payload.service === "saasforge-factory",
  );
}

export function databaseAction({ dockerAvailable, local, reachable }) {
  if (reachable) return "use-configured";
  if (!local) return "reject-external";
  return dockerAvailable ? "start-docker" : "start-prisma";
}

export function databaseStartFallback(action, dockerStarted) {
  return action === "start-docker" && !dockerStarted ? "start-prisma" : action;
}

export async function startLocalDatabase(action, starters) {
  let startAction = action;
  if (startAction === "start-docker") {
    startAction = databaseStartFallback(
      startAction,
      await starters.startDocker(),
    );
  }
  return startAction === "start-prisma"
    ? await starters.startPrisma()
    : undefined;
}

export function factoryPortAction({ healthy, portOpen }) {
  if (healthy) return "use-running";
  return portOpen ? "reject-occupied" : "start-factory";
}

export async function prepareFactory(steps) {
  await steps.install();
  await steps.setup();
  await steps.generate();
  await steps.database();
  await steps.deploy();
}

function processName(name) {
  return process.platform === "win32" && name === "npx" ? `${name}.cmd` : name;
}

function runProcess(command, args, options = {}) {
  const capture = options.capture ?? false;
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      env: process.env,
      shell: process.platform === "win32" && command.endsWith(".cmd"),
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
      windowsHide: true,
    });
    let output = "";
    if (capture) {
      child.stdout?.on("data", (chunk) => {
        output += chunk.toString();
      });
      child.stderr?.on("data", (chunk) => {
        output += chunk.toString();
      });
    }
    child.once("error", reject);
    child.once("exit", (code) => resolve({ code: code ?? 1, output }));
  });
}

async function packageManagerSpec() {
  const manifest = JSON.parse(
    await readFile(path.join(repositoryRoot, "package.json"), "utf8"),
  );
  if (
    typeof manifest.packageManager !== "string" ||
    !/^pnpm@\d+\.\d+\.\d+$/.test(manifest.packageManager)
  ) {
    throw new Error("package.json must pin an exact pnpm packageManager.");
  }
  return manifest.packageManager;
}

async function runPnpm(args, options = {}) {
  const spec = await packageManagerSpec();
  const result = await runProcess(
    processName("npx"),
    ["--yes", `--package=${spec}`, "--", "pnpm", ...args],
    options,
  );
  if (result.code !== 0 && !options.allowFailure) {
    throw new Error(`Command failed: pnpm ${args.join(" ")}`);
  }
  return result;
}

function canConnect(hostname, port, timeout = 1_000) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: hostname, port });
    const finish = (connected) => {
      socket.destroy();
      resolve(connected);
    };
    socket.setTimeout(timeout);
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.once("timeout", () => finish(false));
  });
}

async function databaseIsReachable(databaseUrl) {
  const url = new URL(databaseUrl);
  const port = Number(url.port || "5432");
  return canConnect(url.hostname, port);
}

async function waitFor(check, description, timeout = 30_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${description}.`);
}

async function readDatabaseUrl() {
  const contents = await readFile(environmentPath, "utf8");
  const match = contents.match(/^DATABASE_URL=(.+)$/m);
  if (!match?.[1])
    throw new Error("Local environment is missing DATABASE_URL.");
  return match[1].trim();
}

async function dockerIsAvailable() {
  const compose = await runProcess(
    processName("docker"),
    ["compose", "version"],
    { capture: true },
  ).catch(() => ({ code: 1, output: "" }));
  if (compose.code !== 0) return false;
  const daemon = await runProcess(processName("docker"), ["info"], {
    capture: true,
  }).catch(() => ({ code: 1, output: "" }));
  return daemon.code === 0;
}

async function startPrismaDatabase() {
  let result = await runPnpm(
    [
      "--filter",
      "@saasforge/database",
      "exec",
      "prisma",
      "dev",
      "--detach",
      "--name",
      "saasforge",
    ],
    { allowFailure: true, capture: true },
  );
  if (result.code !== 0) {
    result = await runPnpm(
      [
        "--filter",
        "@saasforge/database",
        "exec",
        "prisma",
        "dev",
        "start",
        "saasforge",
      ],
      { allowFailure: true, capture: true },
    );
  }
  const databaseUrl = databaseUrlFromPrismaOutput(result.output);
  if (result.code !== 0 || !databaseUrl) {
    throw new Error(
      "Could not start a local database. Install Docker Desktop or configure a reachable DATABASE_URL.",
    );
  }
  const contents = await readFile(environmentPath, "utf8");
  await writeFile(
    environmentPath,
    setEnvironmentValue(contents, "DATABASE_URL", databaseUrl),
  );
  return databaseUrl;
}

async function ensureDatabase() {
  let databaseUrl = await readDatabaseUrl();
  const configured = new URL(databaseUrl);
  const local = new Set(["localhost", "127.0.0.1", "::1"]).has(
    configured.hostname,
  );
  const action = databaseAction({
    dockerAvailable: await dockerIsAvailable(),
    local,
    reachable: await databaseIsReachable(databaseUrl),
  });
  if (action === "use-configured") {
    console.log("Database is reachable.");
    return;
  }
  if (action === "reject-external") {
    throw new Error(
      "The configured external database is unreachable; refusing to replace DATABASE_URL.",
    );
  }

  const startedDatabaseUrl = await startLocalDatabase(action, {
    startDocker: async () => {
      console.log("Starting PostgreSQL with Docker Compose...");
      const result = await runProcess(processName("docker"), [
        "compose",
        "up",
        "-d",
        "postgres",
      ]);
      return result.code === 0;
    },
    startPrisma: async () => {
      console.log("Starting Prisma's local database...");
      return startPrismaDatabase();
    },
  });
  if (startedDatabaseUrl) databaseUrl = startedDatabaseUrl;

  await waitFor(() => databaseIsReachable(databaseUrl), "the local database");
  console.log("Database is reachable.");
}

async function fetchFactoryHealth() {
  try {
    const response = await fetch(factoryHealthUrl, { cache: "no-store" });
    return response.ok && isFactoryHealth(await response.json());
  } catch {
    return false;
  }
}

async function startAndVerifyFactory() {
  const action = factoryPortAction({
    healthy: await fetchFactoryHealth(),
    portOpen: await canConnect("127.0.0.1", 3000),
  });
  if (action === "use-running") {
    console.log(`Factory is already running at http://127.0.0.1:3000.`);
    return;
  }
  if (action === "reject-occupied") {
    throw new Error(
      "Port 3000 is occupied by another service. Stop it before starting SaaSForge.",
    );
  }

  const spec = await packageManagerSpec();
  const child = spawn(
    processName("npx"),
    [
      "--yes",
      `--package=${spec}`,
      "--",
      "pnpm",
      "--filter",
      "@saasforge/factory",
      "dev",
    ],
    {
      cwd: repositoryRoot,
      env: process.env,
      shell: process.platform === "win32",
      stdio: "inherit",
      windowsHide: true,
    },
  );
  const stop = () => child.kill("SIGTERM");
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  try {
    await waitFor(
      async () => {
        if (child.exitCode !== null) {
          throw new Error("The factory exited before becoming ready.");
        }
        return fetchFactoryHealth();
      },
      "the factory health endpoint",
      60_000,
    );
    console.log(`Factory verified at http://127.0.0.1:3000.`);
    await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", (code) => {
        if (code === 0 || code === null) resolve();
        else reject(new Error(`The factory exited with code ${code}.`));
      });
    });
  } catch (error) {
    stop();
    throw error;
  } finally {
    process.removeListener("SIGINT", stop);
    process.removeListener("SIGTERM", stop);
  }
}

export async function bootstrapFactory() {
  assertSupportedNode(process.version);
  await prepareFactory({
    install: () => runPnpm(["install", "--frozen-lockfile"]),
    setup: () => runPnpm(["factory:setup"]),
    generate: () => runPnpm(["db:generate"]),
    database: ensureDatabase,
    deploy: () => runPnpm(["db:deploy"]),
  });
  await startAndVerifyFactory();
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  bootstrapFactory().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
