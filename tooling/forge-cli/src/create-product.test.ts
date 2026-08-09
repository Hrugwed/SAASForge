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

  it("rejects traversal and billing without authentication", () => {
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
      readFile(path.join(result.target, ".env.example"), "utf8"),
    ).resolves.toContain("NEXT_PUBLIC_PRODUCT_NAME=Proof Product");
    await expect(
      readFile(
        path.join(root, "apps", "factory", "src", "generated", "products.json"),
        "utf8",
      ),
    ).resolves.toContain('"slug": "proof-product"');
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
