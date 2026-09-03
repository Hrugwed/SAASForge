import { lstat, readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { composeProduct } from "./create-product";
import type {
  CreateProductInput,
  GenerationManifest,
} from "./product-contract";

export const referenceProductProfiles = {
  lean: {
    name: "Reference Pulse",
    slug: "reference-lean",
    description:
      "Verify the standalone analytics foundation with the smallest product profile.",
    modules: ["analytics"],
  },
  full: {
    name: "Reference Operations",
    slug: "reference-full",
    description:
      "Verify every composable SaaS capability in an isolated standalone product.",
    modules: ["auth", "billing", "email", "analytics", "jobs", "storage"],
  },
} as const satisfies Record<string, CreateProductInput>;

export type ReferenceProductProfile = keyof typeof referenceProductProfiles;

function assertOutsideFactory(repositoryRoot: string, target: string): void {
  const relative = path.relative(repositoryRoot, target);
  if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
    throw new Error(
      "Reference products must be generated outside the factory.",
    );
  }
}

async function assertLinkFree(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    const info = await lstat(target);
    if (info.isSymbolicLink() || info.nlink > 1) {
      throw new Error(
        `Reference product contains a linked path: ${entry.name}`,
      );
    }
    if (info.isDirectory()) await assertLinkFree(target);
  }
}

async function assertReferenceStructure(
  target: string,
  input: CreateProductInput,
  manifest: GenerationManifest,
): Promise<void> {
  if (
    manifest.outputMode !== "standalone" ||
    manifest.product.slug !== input.slug ||
    manifest.product.modules.join(",") !== input.modules.join(",")
  ) {
    throw new Error("Generated reference manifest does not match its profile.");
  }
  const expectsDatabase = input.modules.includes("auth");
  if (Boolean(manifest.ownership.database) !== expectsDatabase) {
    throw new Error("Generated reference database ownership is incorrect.");
  }

  const workspace = await readFile(
    path.join(target, "pnpm-workspace.yaml"),
    "utf8",
  );
  if (!workspace.includes('"apps/*"') || !workspace.includes('"packages/*"')) {
    throw new Error("Generated reference workspace is incomplete.");
  }
  await assertLinkFree(target);
}

export async function createReferenceProduct(
  repositoryRoot: string,
  profile: ReferenceProductProfile,
  output: string,
  options: { now?: () => Date } = {},
): Promise<{ target: string; manifest: GenerationManifest }> {
  const target = path.resolve(output);
  assertOutsideFactory(repositoryRoot, target);
  const input = referenceProductProfiles[profile];
  const result = await composeProduct(repositoryRoot, input, target, {
    now: options.now,
    updateRegistry: false,
  });
  await assertReferenceStructure(target, input, result.manifest);
  return { target, manifest: result.manifest };
}
