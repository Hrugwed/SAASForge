import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import net from "node:net";
import { isPlaceholder, readEnvironment } from "./environment";

export type CheckStatus = "pass" | "warn" | "fail";

export type DoctorCheck = {
  id: string;
  status: CheckStatus;
  message: string;
  remediation?: string;
};

export type DoctorReport = {
  mode: "factory" | "product";
  root: string;
  checks: DoctorCheck[];
  ok: boolean;
};

type MigrationStatus = "current" | "pending" | "error";
type FactoryPortStatus = "available" | "factory" | "occupied";

type FactoryProbes = {
  databaseReachable: (url: URL) => Promise<boolean>;
  dockerAvailable: () => boolean;
  factoryPortStatus: () => Promise<FactoryPortStatus>;
  migrationStatus: (root: string, databaseUrl: string) => MigrationStatus;
};

type DoctorOptions = {
  factoryProbes?: Partial<FactoryProbes>;
};

async function exists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      return false;
    throw error;
  }
}

function commandWorks(command: string, args: string[]): boolean {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: "pipe",
    timeout: 10_000,
  });
  return result.status === 0;
}

function canConnect(hostname: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: hostname, port });
    const finish = (connected: boolean) => {
      socket.destroy();
      resolve(connected);
    };
    socket.setTimeout(1_000);
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.once("timeout", () => finish(false));
  });
}

async function databaseReachable(url: URL): Promise<boolean> {
  return canConnect(url.hostname, Number(url.port || "5432"));
}

function migrationStatus(root: string, databaseUrl: string): MigrationStatus {
  const result = spawnSync(
    "pnpm",
    ["--filter", "@saasforge/database", "exec", "prisma", "migrate", "status"],
    {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, DATABASE_URL: databaseUrl },
      shell: process.platform === "win32",
      stdio: "pipe",
      timeout: 20_000,
    },
  );
  if (result.status === 0) return "current";
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  return /not yet been applied|pending migration/i.test(output)
    ? "pending"
    : "error";
}

async function factoryPortStatus(): Promise<FactoryPortStatus> {
  if (!(await canConnect("127.0.0.1", 3000))) return "available";
  try {
    const response = await fetch("http://127.0.0.1:3000/api/health", {
      cache: "no-store",
      signal: AbortSignal.timeout(2_000),
    });
    if (!response.ok) return "occupied";
    const payload = (await response.json()) as {
      service?: unknown;
      status?: unknown;
    };
    return payload.status === "ok" && payload.service === "saasforge-factory"
      ? "factory"
      : "occupied";
  } catch {
    return "occupied";
  }
}

const defaultFactoryProbes: FactoryProbes = {
  databaseReachable,
  dockerAvailable: () =>
    commandWorks("docker", ["compose", "version"]) &&
    commandWorks("docker", ["info"]),
  factoryPortStatus,
  migrationStatus,
};

export function nodeVersionCheck(version: string): DoctorCheck {
  const [major = 0, minor = 0] = version
    .replace(/^v/, "")
    .split(".")
    .map(Number);
  const supported = major === 22 && minor >= 14;
  return supported
    ? {
        id: "node",
        status: "pass",
        message: `Node ${version} satisfies >=22.14.0 <23.`,
      }
    : {
        id: "node",
        status: "fail",
        message: `Node ${version} is unsupported.`,
        remediation: "Install Node >=22.14.0 <23, then rerun the doctor.",
      };
}

async function factoryChecks(
  root: string,
  probes: FactoryProbes,
): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [nodeVersionCheck(process.version)];
  checks.push(
    commandWorks("pnpm", ["--version"])
      ? { id: "pnpm", status: "pass", message: "pnpm is available." }
      : {
          id: "pnpm",
          status: "fail",
          message: "pnpm is not available.",
          remediation:
            "Enable Corepack or install the packageManager version declared in package.json.",
        },
  );

  const requiredFiles = [
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "compose.yaml",
    "AGENTS.md",
    "docs/production-readiness.md",
    "templates/saas-product/base/package.json",
  ];
  const missing = [];
  for (const file of requiredFiles)
    if (!(await exists(path.join(root, file)))) missing.push(file);
  checks.push(
    missing.length === 0
      ? {
          id: "repository",
          status: "pass",
          message: "Required factory files are present.",
        }
      : {
          id: "repository",
          status: "fail",
          message: `Required files are missing: ${missing.join(", ")}.`,
          remediation: "Restore the files from a clean checkout before setup.",
        },
  );

  const generatedClient = path.join(
    root,
    "packages",
    "database",
    "src",
    "generated",
    "prisma",
    "client.ts",
  );
  checks.push(
    (await exists(generatedClient))
      ? {
          id: "database-client",
          status: "pass",
          message: "The Prisma database client is generated.",
        }
      : {
          id: "database-client",
          status: "fail",
          message: "The Prisma database client is missing.",
          remediation: "Run pnpm db:generate before starting the factory.",
        },
  );

  const environmentPath = path.join(root, "apps", "factory", ".env.local");
  let databaseUrl: string | undefined;
  if (!(await exists(environmentPath))) {
    checks.push({
      id: "environment",
      status: "fail",
      message: "Factory local environment is missing.",
      remediation:
        "Run pnpm factory:setup. Existing files are never overwritten.",
    });
  } else {
    const environment = await readEnvironment(environmentPath);
    databaseUrl = environment.DATABASE_URL;
    const required = [
      "NEXT_PUBLIC_APP_URL",
      "DATABASE_URL",
      "BETTER_AUTH_SECRET",
      "BETTER_AUTH_URL",
    ];
    const missingKeys = required.filter((key) => !environment[key]);
    const unsafeSecret =
      isPlaceholder(environment.BETTER_AUTH_SECRET) ||
      (environment.BETTER_AUTH_SECRET?.length ?? 0) < 32;
    checks.push(
      missingKeys.length === 0 && !unsafeSecret
        ? {
            id: "environment",
            status: "pass",
            message:
              "Required local environment keys are present and the auth secret is non-placeholder.",
          }
        : {
            id: "environment",
            status: "fail",
            message:
              "Local environment validation failed without exposing values.",
            remediation: [
              missingKeys.length ? `Add: ${missingKeys.join(", ")}.` : "",
              unsafeSecret
                ? "Generate a unique authentication secret with at least 32 characters."
                : "",
            ]
              .filter(Boolean)
              .join(" "),
          },
    );
  }

  let parsedDatabaseUrl: URL | undefined;
  if (databaseUrl) {
    try {
      parsedDatabaseUrl = new URL(databaseUrl);
      if (!["postgres:", "postgresql:"].includes(parsedDatabaseUrl.protocol)) {
        parsedDatabaseUrl = undefined;
      }
    } catch {
      parsedDatabaseUrl = undefined;
    }
  }

  const reachable = parsedDatabaseUrl
    ? await probes.databaseReachable(parsedDatabaseUrl)
    : false;
  checks.push(
    reachable
      ? {
          id: "database",
          status: "pass",
          message: "The configured database endpoint is reachable.",
        }
      : {
          id: "database",
          status: "fail",
          message: parsedDatabaseUrl
            ? "The configured database endpoint is unreachable."
            : "DATABASE_URL is not a valid PostgreSQL URL.",
          remediation:
            "Start the local database or configure a reachable PostgreSQL DATABASE_URL.",
        },
  );

  if (reachable && databaseUrl) {
    const status = probes.migrationStatus(root, databaseUrl);
    checks.push(
      status === "current"
        ? {
            id: "migrations",
            status: "pass",
            message: "All Prisma migrations are applied.",
          }
        : {
            id: "migrations",
            status: "fail",
            message:
              status === "pending"
                ? "Prisma migrations are pending."
                : "Prisma migration status could not be verified.",
            remediation: "Run pnpm db:deploy, then rerun the doctor.",
          },
    );
  } else {
    checks.push({
      id: "migrations",
      status: "fail",
      message: "Prisma migration status could not be verified.",
      remediation: "Restore database connectivity, then run pnpm db:deploy.",
    });
  }

  const portStatus = await probes.factoryPortStatus();
  checks.push(
    portStatus === "available"
      ? {
          id: "factory-port",
          status: "pass",
          message: "Factory port 3000 is available.",
        }
      : portStatus === "factory"
        ? {
            id: "factory-port",
            status: "pass",
            message: "SaaSForge Factory is already serving on port 3000.",
          }
        : {
            id: "factory-port",
            status: "fail",
            message: "Port 3000 is occupied by another service.",
            remediation:
              "Stop the other service or free port 3000 before starting the factory.",
          },
  );

  checks.push(
    probes.dockerAvailable()
      ? {
          id: "docker",
          status: "pass",
          message: "Docker Compose and its daemon are available.",
        }
      : {
          id: "docker",
          status: "warn",
          message: "Docker Compose or its daemon is unavailable.",
          remediation: reachable
            ? "No action is required while the configured database remains reachable."
            : "Install Docker Desktop or configure an external PostgreSQL DATABASE_URL.",
        },
  );
  return checks;
}

async function productChecks(root: string): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [nodeVersionCheck(process.version)];
  const manifestPath = path.join(root, "saasforge.manifest.json");
  if (!(await exists(manifestPath))) {
    return [
      ...checks,
      {
        id: "manifest",
        status: "fail",
        message: "saasforge.manifest.json is missing.",
        remediation:
          "Regenerate the product or restore its generation manifest.",
      },
    ];
  }
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      schemaVersion?: number;
      outputMode?: string;
      ownership?: {
        application?: string;
        environment?: string;
        database?: string | null;
      };
    };
    const valid =
      typeof manifest.schemaVersion === "number" &&
      [1, 2].includes(manifest.schemaVersion) &&
      manifest.outputMode === "standalone" &&
      manifest.ownership?.application === "apps/web";
    checks.push(
      valid
        ? {
            id: "manifest",
            status: "pass",
            message: "Product manifest is structurally valid.",
          }
        : {
            id: "manifest",
            status: "fail",
            message: "Product manifest uses an unsupported structure.",
            remediation:
              "Use a compatible SaaSForge release or follow the documented upgrade path.",
          },
    );
    const application = manifest.ownership?.application;
    if (application) {
      checks.push(
        (await exists(path.join(root, application, "package.json")))
          ? {
              id: "application",
              status: "pass",
              message: "Owned application package is present.",
            }
          : {
              id: "application",
              status: "fail",
              message: "Owned application package is missing.",
            },
      );
    }
  } catch {
    checks.push({
      id: "manifest",
      status: "fail",
      message: "Product manifest is not valid JSON.",
      remediation:
        "Restore it from the generation record; do not guess ownership fields.",
    });
  }
  return checks;
}

export async function runDoctor(
  root: string,
  options: DoctorOptions = {},
): Promise<DoctorReport> {
  const resolvedRoot = path.resolve(root);
  const mode = (await exists(
    path.join(resolvedRoot, "saasforge.manifest.json"),
  ))
    ? "product"
    : "factory";
  const checks =
    mode === "factory"
      ? await factoryChecks(resolvedRoot, {
          ...defaultFactoryProbes,
          ...options.factoryProbes,
        })
      : await productChecks(resolvedRoot);
  return {
    mode,
    root: resolvedRoot,
    checks,
    ok: checks.every((check) => check.status !== "fail"),
  };
}

export function formatDoctorReport(report: DoctorReport): string {
  const icon = { pass: "PASS", warn: "WARN", fail: "FAIL" } as const;
  const lines = [`SaaSForge doctor (${report.mode})`];
  for (const check of report.checks) {
    lines.push(`[${icon[check.status]}] ${check.message}`);
    if (check.remediation) lines.push(`       ${check.remediation}`);
  }
  lines.push(
    report.ok ? "Doctor result: ready." : "Doctor result: action required.",
  );
  return lines.join("\n");
}
