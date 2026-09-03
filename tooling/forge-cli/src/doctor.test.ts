import { afterEach, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { nodeVersionCheck, runDoctor } from "./doctor";

let root: string | undefined;

afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
  root = undefined;
});

describe("doctor runtime checks", () => {
  it.each(["v22.14.0", "v22.23.2"])(
    'accepts supported Node version "%s"',
    (version) => {
      expect(nodeVersionCheck(version)).toMatchObject({
        id: "node",
        status: "pass",
      });
    },
  );

  it.each(["v20.19.0", "v22.13.1", "v23.0.0", "v24.19.0"])(
    'rejects unsupported Node version "%s"',
    (version) => {
      expect(nodeVersionCheck(version)).toMatchObject({
        id: "node",
        status: "fail",
        remediation: "Install Node >=22.14.0 <23, then rerun the doctor.",
      });
    },
  );

  it("fails when the factory Prisma client has not been generated", async () => {
    root = await mkdtemp(path.join(tmpdir(), "saasforge-doctor-"));
    const requiredFiles = [
      "package.json",
      "pnpm-lock.yaml",
      "pnpm-workspace.yaml",
      "compose.yaml",
      "AGENTS.md",
      "docs/production-readiness.md",
      "templates/saas-product/base/package.json",
    ];
    for (const file of requiredFiles) {
      const target = path.join(root, file);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, "{}\n");
    }
    const environment = path.join(root, "apps", "factory", ".env.local");
    await mkdir(path.dirname(environment), { recursive: true });
    await writeFile(
      environment,
      [
        "NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000",
        "DATABASE_URL=postgresql://local",
        `BETTER_AUTH_SECRET=${"a".repeat(43)}`,
        "BETTER_AUTH_URL=http://127.0.0.1:3000",
      ].join("\n"),
    );

    const report = await runDoctor(root, {
      factoryProbes: {
        databaseReachable: async () => false,
        dockerAvailable: () => false,
        factoryPortStatus: async () => "available",
        migrationStatus: () => "error",
      },
    });

    expect(report.checks).toContainEqual({
      id: "database-client",
      status: "fail",
      message: "The Prisma database client is missing.",
      remediation: "Run pnpm db:generate before starting the factory.",
    });
    expect(report.ok).toBe(false);
  });

  it("reports reachable current database state and an owned factory port", async () => {
    root = await createFactoryFixture();

    const report = await runDoctor(root, {
      factoryProbes: {
        databaseReachable: async () => true,
        dockerAvailable: () => false,
        factoryPortStatus: async () => "factory",
        migrationStatus: () => "current",
      },
    });

    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "database", status: "pass" }),
        expect.objectContaining({ id: "migrations", status: "pass" }),
        expect.objectContaining({ id: "factory-port", status: "pass" }),
        expect.objectContaining({ id: "docker", status: "warn" }),
      ]),
    );
  });

  it("fails for pending migrations and an unrelated port listener", async () => {
    root = await createFactoryFixture();

    const report = await runDoctor(root, {
      factoryProbes: {
        databaseReachable: async () => true,
        dockerAvailable: () => true,
        factoryPortStatus: async () => "occupied",
        migrationStatus: () => "pending",
      },
    });

    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "database", status: "pass" }),
        expect.objectContaining({ id: "migrations", status: "fail" }),
        expect.objectContaining({ id: "factory-port", status: "fail" }),
      ]),
    );
    expect(report.ok).toBe(false);
  });
});

async function createFactoryFixture(): Promise<string> {
  const fixture = await mkdtemp(path.join(tmpdir(), "saasforge-doctor-"));
  const requiredFiles = [
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "compose.yaml",
    "AGENTS.md",
    "docs/production-readiness.md",
    "templates/saas-product/base/package.json",
    "packages/database/src/generated/prisma/client.ts",
  ];
  for (const file of requiredFiles) {
    const target = path.join(fixture, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, "{}\n");
  }
  const environment = path.join(fixture, "apps", "factory", ".env.local");
  await mkdir(path.dirname(environment), { recursive: true });
  await writeFile(
    environment,
    [
      "NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000",
      "DATABASE_URL=postgresql://user:secret@127.0.0.1:5432/saasforge",
      `BETTER_AUTH_SECRET=${"a".repeat(43)}`,
      "BETTER_AUTH_URL=http://127.0.0.1:3000",
    ].join("\n"),
  );
  return fixture;
}
