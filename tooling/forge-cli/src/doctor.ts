import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
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

function nodeVersionCheck(version: string): DoctorCheck {
  const [major = 0, minor = 0] = version
    .replace(/^v/, "")
    .split(".")
    .map(Number);
  const supported = major > 22 || (major === 22 && minor >= 14);
  return supported
    ? {
        id: "node",
        status: "pass",
        message: `Node ${version} satisfies >=22.14.`,
      }
    : {
        id: "node",
        status: "fail",
        message: `Node ${version} is unsupported.`,
        remediation: "Install Node 22.14 or newer, then rerun the doctor.",
      };
}

async function factoryChecks(root: string): Promise<DoctorCheck[]> {
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

  const environmentPath = path.join(root, "apps", "factory", ".env.local");
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

  checks.push(
    commandWorks("docker", ["compose", "version"])
      ? {
          id: "docker",
          status: "pass",
          message: "Docker Compose is available.",
        }
      : {
          id: "docker",
          status: "warn",
          message: "Docker Compose is unavailable.",
          remediation:
            "Install Docker Desktop or configure an external PostgreSQL DATABASE_URL.",
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
      manifest.schemaVersion === 1 &&
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

export async function runDoctor(root: string): Promise<DoctorReport> {
  const resolvedRoot = path.resolve(root);
  const mode = (await exists(
    path.join(resolvedRoot, "saasforge.manifest.json"),
  ))
    ? "product"
    : "factory";
  const checks =
    mode === "factory"
      ? await factoryChecks(resolvedRoot)
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
