import { afterEach, describe, expect, it } from "vitest";
import {
  cp,
  link,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { composeProduct } from "./create-product";
import { upgradeProduct } from "./upgrade-product";

let root: string | undefined;
let productRoot: string | undefined;

afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
  if (productRoot) await rm(productRoot, { recursive: true, force: true });
  root = undefined;
  productRoot = undefined;
});

async function fixture() {
  root = await mkdtemp(path.join(tmpdir(), "saasforge-upgrade-test-"));
  const source = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../..",
  );
  for (const directory of ["templates", "packages"]) {
    await cp(path.join(source, directory), path.join(root, directory), {
      recursive: true,
      filter: (entry) => path.basename(entry) !== "node_modules",
    });
  }
  await cp(
    path.join(source, "tooling", "security"),
    path.join(root, "tooling", "security"),
    { recursive: true },
  );
  for (const file of ["package.json", "tsconfig.base.json", "turbo.json"]) {
    await cp(path.join(source, file), path.join(root, file));
  }
  await cp(path.join(source, "docs"), path.join(root, "docs"), {
    recursive: true,
  });
  const product = path.join(
    path.dirname(root),
    `upgrade-product-standalone-${path.basename(root)}`,
  );
  const generated = await composeProduct(
    root,
    {
      name: "Upgrade Product",
      slug: "upgrade-product",
      description: "A standalone product used to prove safe factory upgrades.",
      modules: [],
    },
    product,
    { updateRegistry: false },
  );
  productRoot = generated.target;
  return { factory: root, product: generated.target };
}

async function setVersion(factory: string, version: string) {
  const packagePath = path.join(factory, "package.json");
  const content = JSON.parse(await readFile(packagePath, "utf8")) as Record<
    string,
    unknown
  >;
  content.version = version;
  await writeFile(packagePath, `${JSON.stringify(content, null, 2)}\n`);
}

describe("standalone product upgrades", { timeout: 15_000 }, () => {
  it("plans by default and applies a factory-only change safely", async () => {
    const { factory, product } = await fixture();
    const readme = path.join(
      factory,
      "templates",
      "saas-product",
      "base",
      "README.md",
    );
    await writeFile(readme, "# {{PRODUCT_NAME}}\n\nFactory v2 content.\n");
    await setVersion(factory, "0.2.0");
    const plan = await upgradeProduct(factory, product);
    expect(plan.applied).toBe(false);
    expect(plan.updated).toContain("apps/web/README.md");
    await expect(
      readFile(path.join(product, "apps", "web", "README.md"), "utf8"),
    ).resolves.not.toContain("Factory v2");
    const applied = await upgradeProduct(factory, product, { apply: true });
    expect(applied.applied).toBe(true);
    await expect(
      readFile(path.join(product, "apps", "web", "README.md"), "utf8"),
    ).resolves.toContain("Factory v2 content");
    await expect(
      readFile(path.join(product, "saasforge.manifest.json"), "utf8"),
    ).resolves.toContain('"version": "0.2.0"');
    expect((await upgradeProduct(factory, product)).updated).toEqual([]);
  });

  it("preserves product-only customizations while applying other changes", async () => {
    const { factory, product } = await fixture();
    const productReadme = path.join(product, "apps", "web", "README.md");
    await writeFile(productReadme, "# Product-owned documentation\n");
    await writeFile(
      path.join(
        factory,
        "templates",
        "saas-product",
        "repository",
        "docs",
        "new.md",
      ),
      "# New factory documentation\n",
    );
    const result = await upgradeProduct(factory, product, { apply: true });
    expect(result.conflicts).toEqual([]);
    expect(result.preserved).toContain("apps/web/README.md");
    expect(result.added).toContain("docs/new.md");
    await expect(readFile(productReadme, "utf8")).resolves.toContain(
      "Product-owned",
    );
  });

  it("does not write any file when both sides changed the same managed file", async () => {
    const { factory, product } = await fixture();
    const productReadme = path.join(product, "apps", "web", "README.md");
    const beforeManifest = await readFile(
      path.join(product, "saasforge.manifest.json"),
    );
    await writeFile(productReadme, "# Product change\n");
    await writeFile(
      path.join(factory, "templates", "saas-product", "base", "README.md"),
      "# {{PRODUCT_NAME}}\n\nFactory change.\n",
    );
    await setVersion(factory, "0.2.0");
    const result = await upgradeProduct(factory, product, { apply: true });
    expect(result.applied).toBe(false);
    expect(result.conflicts).toContain("apps/web/README.md");
    await expect(readFile(productReadme, "utf8")).resolves.toBe(
      "# Product change\n",
    );
    await expect(
      readFile(path.join(product, "saasforge.manifest.json")),
    ).resolves.toEqual(beforeManifest);
  });

  it("treats a product customization of a factory-removed file as a conflict", async () => {
    const { factory, product } = await fixture();
    const productGuide = path.join(product, "docs", "upgrades.md");
    await writeFile(productGuide, "# Product-owned upgrade guide\n");
    await rm(
      path.join(
        factory,
        "templates",
        "saas-product",
        "repository",
        "docs",
        "upgrades.md",
      ),
    );
    const result = await upgradeProduct(factory, product, { apply: true });
    expect(result.conflicts).toContain("docs/upgrades.md");
    expect(result.applied).toBe(false);
    await expect(readFile(productGuide, "utf8")).resolves.toContain(
      "Product-owned",
    );
  });

  it("treats a product deletion and factory change of the same file as a conflict", async () => {
    const { factory, product } = await fixture();
    await rm(path.join(product, "apps", "web", "README.md"));
    await writeFile(
      path.join(factory, "templates", "saas-product", "base", "README.md"),
      "# {{PRODUCT_NAME}}\n\nFactory change.\n",
    );
    await setVersion(factory, "0.2.0");
    const result = await upgradeProduct(factory, product, { apply: true });
    expect(result.conflicts).toContain("apps/web/README.md");
    await expect(
      readFile(path.join(product, "apps", "web", "README.md"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("adds and removes factory-only managed files", async () => {
    const { factory, product } = await fixture();
    await rm(
      path.join(
        factory,
        "templates",
        "saas-product",
        "repository",
        "docs",
        "upgrades.md",
      ),
    );
    await writeFile(
      path.join(
        factory,
        "templates",
        "saas-product",
        "repository",
        "docs",
        "added.md",
      ),
      "# Added\n",
    );
    await setVersion(factory, "0.2.0");
    const result = await upgradeProduct(factory, product, { apply: true });
    expect(result.removed).toContain("docs/upgrades.md");
    expect(result.added).toContain("docs/added.md");
    await expect(
      readFile(path.join(product, "docs", "added.md"), "utf8"),
    ).resolves.toContain("Added");
    await expect(
      readFile(path.join(product, "docs", "upgrades.md"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("does not overwrite an untracked file that collides with a factory addition", async () => {
    const { factory, product } = await fixture();
    const collision = path.join(product, "docs", "added.md");
    await writeFile(collision, "# Product-only file\n");
    await writeFile(
      path.join(
        factory,
        "templates",
        "saas-product",
        "repository",
        "docs",
        "added.md",
      ),
      "# Factory file\n",
    );
    const result = await upgradeProduct(factory, product, { apply: true });
    expect(result.conflicts).toContain("docs/added.md");
    await expect(readFile(collision, "utf8")).resolves.toBe(
      "# Product-only file\n",
    );
  });

  it("rolls back mutated files and the exact original manifest after a failed apply", async () => {
    const { factory, product } = await fixture();
    const added = path.join(
      factory,
      "templates",
      "saas-product",
      "repository",
      "docs",
      "added.md",
    );
    await writeFile(added, "# Added\n");
    const beforeManifest = await readFile(
      path.join(product, "saasforge.manifest.json"),
    );
    await expect(
      upgradeProduct(factory, product, { apply: true, failAfterMutation: 1 }),
    ).rejects.toThrow("Injected upgrade failure");
    await expect(
      readFile(path.join(product, "saasforge.manifest.json")),
    ).resolves.toEqual(beforeManifest);
    await expect(
      readFile(path.join(product, "docs", "added.md"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("does not write anything when failure is injected before the first mutation", async () => {
    const { factory, product } = await fixture();
    await writeFile(
      path.join(
        factory,
        "templates",
        "saas-product",
        "repository",
        "docs",
        "added.md",
      ),
      "# Added\n",
    );
    const beforeManifest = await readFile(
      path.join(product, "saasforge.manifest.json"),
    );
    await expect(
      upgradeProduct(factory, product, {
        apply: true,
        failBeforeFirstMutation: true,
      }),
    ).rejects.toThrow("before managed-file mutation");
    await expect(
      readFile(path.join(product, "saasforge.manifest.json")),
    ).resolves.toEqual(beforeManifest);
    await expect(
      readFile(path.join(product, "docs", "added.md"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rolls back an updated file after a failed apply", async () => {
    const { factory, product } = await fixture();
    const factoryGuide = path.join(
      factory,
      "templates",
      "saas-product",
      "repository",
      "docs",
      "upgrades.md",
    );
    const productGuide = path.join(product, "docs", "upgrades.md");
    const before = await readFile(productGuide);
    await writeFile(factoryGuide, "# Updated factory guide\n");
    await expect(
      upgradeProduct(factory, product, { apply: true, failAfterMutation: 1 }),
    ).rejects.toThrow("after managed-file mutation");
    await expect(readFile(productGuide)).resolves.toEqual(before);
  });

  it("rolls back a removed file after a failed apply", async () => {
    const { factory, product } = await fixture();
    const factoryGuide = path.join(
      factory,
      "templates",
      "saas-product",
      "repository",
      "docs",
      "upgrades.md",
    );
    const productGuide = path.join(product, "docs", "upgrades.md");
    const before = await readFile(productGuide);
    await rm(factoryGuide);
    await expect(
      upgradeProduct(factory, product, { apply: true, failAfterMutation: 1 }),
    ).rejects.toThrow("after managed-file mutation");
    await expect(readFile(productGuide)).resolves.toEqual(before);
  });

  it("leaves a byte-identical manifest untouched for a no-op apply", async () => {
    const { factory, product } = await fixture();
    const manifestPath = path.join(product, "saasforge.manifest.json");
    const before = await readFile(manifestPath);
    const result = await upgradeProduct(factory, product, { apply: true });
    expect(result.applied).toBe(false);
    await expect(readFile(manifestPath)).resolves.toEqual(before);
  });

  it("preserves an external manifest edit made before the final manifest write", async () => {
    const { factory, product } = await fixture();
    await writeFile(
      path.join(
        factory,
        "templates",
        "saas-product",
        "repository",
        "docs",
        "added.md",
      ),
      "# Added\n",
    );
    const manifestPath = path.join(product, "saasforge.manifest.json");
    const externalManifest = Buffer.from('{"external":true}\n');
    await expect(
      upgradeProduct(factory, product, {
        apply: true,
        beforeManifestWrite: async () =>
          writeFile(manifestPath, externalManifest),
      }),
    ).rejects.toThrow("Manifest changed before final upgrade manifest write");
    await expect(readFile(manifestPath)).resolves.toEqual(externalManifest);
    await expect(
      readFile(path.join(product, "docs", "added.md"), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects a target factory version that would downgrade the product", async () => {
    const { factory, product } = await fixture();
    const manifestPath = path.join(product, "saasforge.manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      factory: { version: string };
    };
    manifest.factory.version = "0.3.0";
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await expect(upgradeProduct(factory, product)).rejects.toThrow(
      "Refusing factory downgrade",
    );
  });

  it("rejects products inside the factory and invalid manifests", async () => {
    const { factory, product } = await fixture();
    await expect(upgradeProduct(factory, factory)).rejects.toThrow("disjoint");
    await expect(
      upgradeProduct(factory, path.dirname(factory)),
    ).rejects.toThrow("disjoint");
    await writeFile(path.join(product, "saasforge.manifest.json"), "{}");
    await expect(upgradeProduct(factory, product)).rejects.toThrow(
      "supported SaaSForge v2",
    );
  });

  it("rejects secret-like managed paths in an otherwise valid manifest", async () => {
    const { factory, product } = await fixture();
    const manifestPath = path.join(product, "saasforge.manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      managedFiles: Record<string, string>;
    };
    manifest.managedFiles["apps/web/.env.production"] = "a".repeat(64);
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await expect(upgradeProduct(factory, product)).rejects.toThrow(
      "unsafe managed file path",
    );
  });

  it("rejects managed paths that escape through a symbolic link", async () => {
    const { factory, product } = await fixture();
    const outside = await mkdtemp(path.join(tmpdir(), "saasforge-outside-"));
    try {
      await rm(path.join(product, "docs"), { recursive: true, force: true });
      await symlink(outside, path.join(product, "docs"), "junction");
      await expect(upgradeProduct(factory, product)).rejects.toThrow(
        "symbolic link",
      );
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it("rejects an in-product symbolic-link ancestor", async () => {
    const { factory, product } = await fixture();
    const linkedDocs = path.join(product, "linked-docs");
    await mkdir(linkedDocs);
    await rm(path.join(product, "docs"), { recursive: true, force: true });
    await symlink(linkedDocs, path.join(product, "docs"), "junction");
    await expect(upgradeProduct(factory, product)).rejects.toThrow(
      "symbolic link",
    );
  });

  it("rejects hard-linked managed files without mutating the linked sentinel", async () => {
    const { factory, product } = await fixture();
    const managed = path.join(product, "docs", "upgrades.md");
    const sentinel = path.join(product, "unmanaged-hardlink-sentinel.md");
    const before = await readFile(managed);
    await link(managed, sentinel);
    await expect(upgradeProduct(factory, product)).rejects.toThrow(
      "multiple hard links",
    );
    await expect(readFile(sentinel)).resolves.toEqual(before);
  });
});
