import { afterEach, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { inspectControlPlane } from "./control-plane-core";

const generatedAt = "2026-08-15T00:00:00.000Z";
let roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.map((root) => rm(root, { recursive: true, force: true })),
  );
  roots = [];
});

async function fixture(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "saasforge-control-plane-"));
  roots.push(root);
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "saasforge", version: "0.2.0" }),
  );
  const registryDirectory = path.join(
    root,
    "apps",
    "factory",
    "src",
    "generated",
  );
  await mkdir(registryDirectory, { recursive: true });
  await writeFile(path.join(registryDirectory, "products.json"), "[]\n");
  return root;
}

function registryEntry(slug = "proof-product") {
  return {
    name: "Proof Product",
    slug,
    description: "A generated product used to verify the control plane.",
    modules: ["auth", "analytics"] as const,
    createdAt: generatedAt,
    status: "generated" as const,
    mode: "standalone" as const,
    relativePath: `products/${slug}`,
  };
}

async function writeRegistry(root: string, value: unknown): Promise<void> {
  await writeFile(
    path.join(root, "apps", "factory", "src", "generated", "products.json"),
    `${JSON.stringify(value, null, 2)}\n`,
  );
}

async function writeProduct(
  root: string,
  options: {
    slug?: string;
    factoryVersion?: string;
    manifestName?: string;
  } = {},
): Promise<string> {
  const slug = options.slug ?? "proof-product";
  const productRoot = path.join(root, "products", slug);
  for (const directory of [
    "apps/web",
    "scripts",
    "docs",
    "packages/auth",
    "packages/analytics",
    "packages/config",
    "packages/database",
    "packages/email",
    "packages/observability",
    "packages/ui",
  ]) {
    await mkdir(path.join(productRoot, directory), { recursive: true });
  }
  await writeFile(path.join(productRoot, "package.json"), "{}\n");
  await writeFile(path.join(productRoot, "AGENTS.md"), "# Product agent\n");
  await writeFile(
    path.join(productRoot, "scripts", "doctor.mjs"),
    "console.log('doctor');\n",
  );
  await writeFile(
    path.join(productRoot, "saasforge.manifest.json"),
    `${JSON.stringify(
      {
        schemaVersion: 2,
        factory: {
          name: "SaaSForge",
          version: options.factoryVersion ?? "0.2.0",
          templateVersion: 2,
        },
        product: {
          name: options.manifestName ?? "Proof Product",
          slug,
          description: "A generated product used to verify the control plane.",
          modules: ["auth", "analytics"],
        },
        outputMode: "standalone",
        generatedAt,
        ownership: {
          application: "apps/web",
          database: "packages/database/prisma/schema.prisma",
          environment: "apps/web/.env.local",
        },
        managedFiles: {
          "apps/web/package.json": "a".repeat(64),
        },
      },
      null,
      2,
    )}\n`,
  );
  return productRoot;
}

describe("control-plane inspection", () => {
  it("reads empty and changed registries on separate inspections", async () => {
    const root = await fixture();
    await expect(inspectControlPlane(root)).resolves.toMatchObject({
      products: [],
      issues: [],
      counts: { registered: 0 },
    });

    await writeProduct(root);
    await writeRegistry(root, [registryEntry()]);
    const changed = await inspectControlPlane(root);
    expect(changed.products).toHaveLength(1);
    expect(changed.products[0]).toMatchObject({
      slug: "proof-product",
      evidenceState: "tracked",
      inspectionCode: "verified",
      identitySource: "manifest-verified",
      generatedWith: "0.2.0",
      versionState: "current",
      managedFileCount: 1,
    });
    expect(changed.products[0]?.artifacts).toHaveLength(12);
    expect(JSON.stringify(changed)).not.toContain("a".repeat(64));
  });

  it("classifies behind and ahead products without calling them healthy", async () => {
    const root = await fixture();
    await writeProduct(root, {
      slug: "older-product",
      factoryVersion: "0.1.0",
    });
    await writeProduct(root, {
      slug: "newer-product",
      factoryVersion: "0.3.0",
    });
    const older = { ...registryEntry("older-product") };
    const newer = { ...registryEntry("newer-product") };
    await writeRegistry(root, [older, newer]);

    const snapshot = await inspectControlPlane(root);
    expect(snapshot.products.map((product) => product.versionState)).toEqual([
      "behind",
      "ahead",
    ]);
    expect(
      snapshot.products.every(
        (product) => product.evidenceState === "review-required",
      ),
    ).toBe(true);
  });

  it("bounds malformed registry data and keeps valid entries inspectable", async () => {
    const root = await fixture();
    await writeProduct(root);
    await writeRegistry(root, [
      { unexpected: "outside-secret-value" },
      registryEntry(),
      registryEntry(),
    ]);

    const snapshot = await inspectControlPlane(root);
    expect(snapshot.products).toHaveLength(1);
    expect(snapshot.issues.map((issue) => issue.code)).toEqual([
      "registry-entry-invalid",
      "registry-duplicate",
    ]);
    expect(JSON.stringify(snapshot)).not.toContain("outside-secret-value");
  });

  it("reports missing, malformed, and mismatched manifests as attention", async () => {
    const root = await fixture();
    await writeRegistry(root, [registryEntry()]);

    let snapshot = await inspectControlPlane(root);
    expect(snapshot.products[0]).toMatchObject({
      inspectionCode: "products-root-missing",
      identitySource: "registry-unverified",
      signals: expect.arrayContaining([
        expect.objectContaining({ state: "unverified" }),
      ]),
    });

    const productRoot = await writeProduct(root);
    await writeFile(path.join(productRoot, "saasforge.manifest.json"), "{}\n");
    snapshot = await inspectControlPlane(root);
    expect(snapshot.products[0]?.inspectionCode).toBe("manifest-malformed");

    await rm(productRoot, { recursive: true, force: true });
    await writeProduct(root, { manifestName: "Different Product" });
    snapshot = await inspectControlPlane(root);
    expect(snapshot.products[0]?.inspectionCode).toBe("identity-mismatch");
  });

  it("rejects registry traversal before filesystem access", async () => {
    const root = await fixture();
    const outside = await mkdtemp(path.join(tmpdir(), "saasforge-sentinel-"));
    roots.push(outside);
    await writeFile(path.join(outside, "sentinel.txt"), "outside-secret-value");
    await writeRegistry(root, [
      { ...registryEntry(), relativePath: "../saasforge-sentinel" },
      {
        ...registryEntry("windows-path"),
        relativePath: "C:\\outside\\windows-path",
      },
    ]);

    const snapshot = await inspectControlPlane(root);
    expect(snapshot.products).toEqual([]);
    expect(snapshot.issues).toHaveLength(2);
    expect(JSON.stringify(snapshot)).not.toContain("outside-secret-value");
  });

  it("fails closed when a registered product is a symlink", async () => {
    const root = await fixture();
    const outside = await mkdtemp(path.join(tmpdir(), "saasforge-linked-"));
    roots.push(outside);
    await writeFile(path.join(outside, "sentinel.txt"), "outside-secret-value");
    await mkdir(path.join(root, "products"), { recursive: true });
    await symlink(
      outside,
      path.join(root, "products", "proof-product"),
      "junction",
    );
    await writeRegistry(root, [registryEntry()]);

    const snapshot = await inspectControlPlane(root);
    expect(snapshot.products[0]).toMatchObject({
      evidenceState: "attention",
      inspectionCode: "path-unsafe",
    });
    expect(JSON.stringify(snapshot)).not.toContain("outside-secret-value");
  });

  it("marks a valid manifest with a missing selected module as incomplete", async () => {
    const root = await fixture();
    const productRoot = await writeProduct(root);
    await rm(path.join(productRoot, "packages", "analytics"), {
      recursive: true,
      force: true,
    });
    await writeRegistry(root, [registryEntry()]);

    const snapshot = await inspectControlPlane(root);
    expect(snapshot.products[0]).toMatchObject({
      identitySource: "manifest-verified",
      inspectionCode: "artifact-incomplete",
      evidenceState: "attention",
    });
    expect(snapshot.products[0]?.artifacts).toContainEqual({
      key: "package-analytics",
      label: "analytics capability package",
      state: "missing",
    });
  });

  it("rejects a registry beneath a linked ancestor", async () => {
    const root = await fixture();
    const generated = path.join(root, "apps", "factory", "src", "generated");
    const outside = await mkdtemp(
      path.join(tmpdir(), "saasforge-linked-registry-"),
    );
    roots.push(outside);
    await writeFile(
      path.join(outside, "products.json"),
      '[{"secret":"outside-secret-value"}]\n',
    );
    await rm(generated, { recursive: true, force: true });
    await symlink(outside, generated, "junction");

    const snapshot = await inspectControlPlane(root);
    expect(snapshot.products).toEqual([]);
    expect(snapshot.issues).toEqual([
      expect.objectContaining({ code: "registry-unsafe" }),
    ]);
    expect(JSON.stringify(snapshot)).not.toContain("outside-secret-value");
  });
});
