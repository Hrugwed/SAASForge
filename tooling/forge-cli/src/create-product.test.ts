import { afterEach, describe, expect, it } from "vitest";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createProduct, createProductInputSchema } from "./create-product";

let temporaryRoot: string | undefined;

afterEach(async () => {
  if (temporaryRoot) {
    await rm(temporaryRoot, { recursive: true, force: true });
    temporaryRoot = undefined;
  }
});

async function createRepositoryFixture(packageJson: string) {
  temporaryRoot = await mkdtemp(path.join(tmpdir(), "saasforge-generator-"));
  const base = path.join(temporaryRoot, "templates", "saas-product", "base");
  await mkdir(base, { recursive: true });
  await writeFile(path.join(base, "package.json"), packageJson, "utf8");
  await writeFile(
    path.join(base, ".env.example"),
    "NEXT_PUBLIC_PRODUCT_NAME=__PRODUCT_NAME__\n",
    "utf8",
  );
  await writeFile(
    path.join(base, "README.md"),
    "# {{PRODUCT_NAME}}\n\n{{PRODUCT_DESCRIPTION}}\n",
    "utf8",
  );
  await writeFile(
    path.join(temporaryRoot, "package.json"),
    JSON.stringify({ name: "saasforge", version: "1.2.3" }),
    "utf8",
  );
  await writeFile(
    path.join(temporaryRoot, "tsconfig.base.json"),
    "{}\n",
    "utf8",
  );
  await writeFile(path.join(temporaryRoot, "turbo.json"), "{}\n", "utf8");
  const securityTooling = path.join(temporaryRoot, "tooling", "security");
  await mkdir(securityTooling, { recursive: true });
  await writeFile(
    path.join(securityTooling, "license-check.mjs"),
    "console.log('licenses');\n",
    "utf8",
  );
  const scripts = path.join(
    temporaryRoot,
    "templates",
    "saas-product",
    "repository",
    "scripts",
  );
  await mkdir(scripts, { recursive: true });
  await writeFile(
    path.join(scripts, "doctor.mjs"),
    "console.log('doctor');\n",
    "utf8",
  );
  const repositoryTemplate = path.join(
    temporaryRoot,
    "templates",
    "saas-product",
    "repository",
  );
  const workflows = path.join(repositoryTemplate, ".github", "workflows");
  const runbooks = path.join(repositoryTemplate, "docs", "runbooks");
  await mkdir(workflows, { recursive: true });
  await mkdir(runbooks, { recursive: true });
  await writeFile(
    path.join(repositoryTemplate, "vercel.json"),
    JSON.stringify({
      buildCommand: "pnpm --filter @products/__PRODUCT_SLUG__ build",
    }),
    "utf8",
  );
  await writeFile(
    path.join(workflows, "quality.yml"),
    "jobs:\n  verify:\n    steps:\n      # __DATABASE_QUALITY_STEPS__\n",
    "utf8",
  );
  await writeFile(
    path.join(workflows, "deploy-production.yml"),
    "jobs:\n  release:\n    steps:\n      # __DATABASE_DEPLOY_STEP__\n",
    "utf8",
  );
  await writeFile(path.join(runbooks, "rollback.md"), "# Rollback\n", "utf8");
  for (const packageName of [
    "analytics",
    "auth",
    "billing",
    "config",
    "database",
    "email",
    "jobs",
    "observability",
    "storage",
    "ui",
  ]) {
    const packageRoot = path.join(temporaryRoot, "packages", packageName);
    await mkdir(packageRoot, { recursive: true });
    await writeFile(
      path.join(packageRoot, "package.json"),
      JSON.stringify({ name: `@saasforge/${packageName}` }),
      "utf8",
    );
  }
  return temporaryRoot;
}

describe("product generator input", () => {
  it("accepts a safe product blueprint", () => {
    expect(
      createProductInputSchema.safeParse({
        name: "Signal Desk",
        slug: "signal-desk",
        description:
          "Turn noisy customer signals into a prioritized product brief.",
        modules: ["auth", "billing", "analytics"],
      }).success,
    ).toBe(true);
  });

  it("rejects traversal and tenant modules without authentication", () => {
    expect(
      createProductInputSchema.safeParse({
        name: "Unsafe Product",
        slug: "../unsafe",
        description: "This should never be accepted by the product generator.",
        modules: ["auth"],
      }).success,
    ).toBe(false);
    expect(
      createProductInputSchema.safeParse({
        name: "Incomplete Product",
        slug: "incomplete-product",
        description:
          "This billing configuration deliberately omits authentication.",
        modules: ["billing"],
      }).success,
    ).toBe(false);
    expect(
      createProductInputSchema.safeParse({
        name: "Unowned Storage",
        slug: "unowned-storage",
        description:
          "This storage configuration deliberately omits tenant authentication.",
        modules: ["storage"],
      }).success,
    ).toBe(false);
  });

  it("creates a product and records it only after a successful composition", async () => {
    const root = await createRepositoryFixture(
      JSON.stringify({ dependencies: { "@saasforge/config": "workspace:*" } }),
    );
    const result = await createProduct(root, {
      name: "Proof Product",
      slug: "proof-product",
      description: "A complete product generation test with safe fixture data.",
      modules: [],
    });

    await expect(
      readFile(path.join(result.target, "apps", "web", ".env.example"), "utf8"),
    ).resolves.toContain("NEXT_PUBLIC_PRODUCT_NAME=Proof Product");
    await expect(
      readFile(path.join(result.target, "saasforge.manifest.json"), "utf8"),
    ).resolves.toContain('"version": "1.2.3"');
    expect(result.manifest.schemaVersion).toBe(2);
    expect(result.manifest.managedFiles["apps/web/package.json"]).toMatch(
      /^[a-f0-9]{64}$/,
    );
    await expect(
      readFile(path.join(result.target, "apps", "web", "README.md"), "utf8"),
    ).resolves.toContain("# Proof Product");
    await expect(
      readFile(
        path.join(result.target, "packages", "config", "package.json"),
        "utf8",
      ),
    ).resolves.toContain("@saasforge/config");
    await expect(
      readFile(
        path.join(result.target, "packages", "observability", "package.json"),
        "utf8",
      ),
    ).resolves.toContain("@saasforge/observability");
    await expect(
      readFile(
        path.join(
          result.target,
          "apps",
          "web",
          "src",
          "app",
          "api",
          "ready",
          "route.ts",
        ),
        "utf8",
      ),
    ).resolves.toContain('status: healthy ? "ready" : "unavailable"');
    await expect(
      stat(path.join(result.target, "scripts", "doctor.mjs")),
    ).resolves.toBeDefined();
    await expect(
      readFile(path.join(result.target, "vercel.json"), "utf8"),
    ).resolves.toContain("@products/proof-product");
    await expect(
      readFile(
        path.join(result.target, ".github", "workflows", "quality.yml"),
        "utf8",
      ),
    ).resolves.not.toContain("__DATABASE_QUALITY_STEPS__");
    await expect(
      stat(path.join(result.target, "docs", "runbooks", "rollback.md")),
    ).resolves.toBeDefined();
    await expect(
      readFile(
        path.join(root, "apps", "factory", "src", "generated", "products.json"),
        "utf8",
      ),
    ).resolves.toContain('"mode": "standalone"');
  });

  it("copies the selected package dependency closure into an independent repository", async () => {
    const root = await createRepositoryFixture(
      JSON.stringify({ dependencies: { "@saasforge/config": "workspace:*" } }),
    );
    const result = await createProduct(
      root,
      {
        name: "Paid Product",
        slug: "paid-product",
        description:
          "A paid product fixture that verifies capability ownership.",
        modules: ["auth", "billing"],
      },
      { now: () => new Date("2026-01-02T03:04:05.000Z") },
    );

    await expect(
      stat(path.join(result.target, "packages", "auth")),
    ).resolves.toBeDefined();
    await expect(
      stat(path.join(result.target, "packages", "billing")),
    ).resolves.toBeDefined();
    await expect(
      stat(path.join(result.target, "packages", "database")),
    ).resolves.toBeDefined();
    await expect(
      stat(path.join(result.target, "apps", "factory")),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(result.manifest.generatedAt).toBe("2026-01-02T03:04:05.000Z");
    expect(result.manifest.ownership.database).toBe(
      "packages/database/prisma/schema.prisma",
    );
    const rootManifest = JSON.parse(
      await readFile(path.join(result.target, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    expect(rootManifest.scripts.postinstall).toBe("pnpm db:generate");
    await expect(
      readFile(
        path.join(
          result.target,
          ".github",
          "workflows",
          "deploy-production.yml",
        ),
        "utf8",
      ),
    ).resolves.toContain("pnpm db:deploy");
    await expect(
      readFile(path.join(result.target, "vercel.json"), "utf8"),
    ).resolves.toContain("/api/internal/billing/reconcile");
  });

  it("removes partial output when composition fails", async () => {
    const root = await createRepositoryFixture("not valid JSON");
    const target = path.join(root, "products", "broken-product");

    await expect(
      createProduct(root, {
        name: "Broken Product",
        slug: "broken-product",
        description:
          "A deliberate failure used to verify atomic generation rollback.",
        modules: [],
      }),
    ).rejects.toThrow();
    await expect(stat(target)).rejects.toMatchObject({ code: "ENOENT" });
  });
});
