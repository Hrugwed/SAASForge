import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import {
  createReferenceProduct,
  referenceProductProfiles,
} from "./reference-product";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) =>
      rm(root, {
        recursive: true,
        force: true,
      }),
    ),
  );
});

describe("standalone reference products", () => {
  for (const profile of ["lean", "full"] as const) {
    it(`generates the ${profile} profile outside the factory without registry state`, async () => {
      const temporaryRoot = await mkdtemp(
        path.join(os.tmpdir(), `saasforge-reference-${profile}-`),
      );
      temporaryRoots.push(temporaryRoot);
      const target = path.join(
        temporaryRoot,
        referenceProductProfiles[profile].slug,
      );
      const result = await createReferenceProduct(
        repositoryRoot,
        profile,
        target,
        { now: () => new Date("2026-09-03T00:00:00.000Z") },
      );

      expect(result.manifest.product).toEqual(
        referenceProductProfiles[profile],
      );
      expect(result.manifest.ownership.database).toBe(
        profile === "full" ? "packages/database/prisma/schema.prisma" : null,
      );
      await expect(
        readFile(path.join(target, "saasforge.manifest.json"), "utf8"),
      ).resolves.toContain('"outputMode": "standalone"');
      await expect(
        readFile(
          path.join(target, "apps", "web", "tests", "e2e", "smoke.spec.ts"),
          "utf8",
        ),
      ).resolves.toContain(referenceProductProfiles[profile].name);
      await expect(
        readFile(path.join(target, "apps", "factory", "package.json"), "utf8"),
      ).rejects.toMatchObject({ code: "ENOENT" });
    }, 15_000);
  }

  it("refuses to write a reference product inside the factory", async () => {
    await expect(
      createReferenceProduct(
        repositoryRoot,
        "lean",
        path.join(repositoryRoot, "products", "reference-lean"),
      ),
    ).rejects.toThrow("outside the factory");
  });
});
