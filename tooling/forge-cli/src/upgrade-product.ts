import { createHash } from "node:crypto";
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { composeProduct } from "./create-product";
import {
  assertGenerationManifest,
  compareSemanticVersions,
  type GenerationManifest,
} from "./product-contract";

type Action =
  "added" | "updated" | "removed" | "preserved" | "unchanged" | "conflicts";

export type UpgradeResult = {
  fromVersion: string;
  toVersion: string;
  added: string[];
  updated: string[];
  removed: string[];
  preserved: string[];
  unchanged: string[];
  conflicts: string[];
  applied: boolean;
};

type JournalEntry = {
  relative: string;
  beforeHash: string | null;
  afterHash: string | null;
  backupPath: string | null;
};

function isInside(parent: string, target: string): boolean {
  const relative = path.relative(parent, target);
  return (
    !relative || (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

async function fileHash(
  root: string,
  relative: string,
): Promise<string | null> {
  const target = await managedTarget(root, relative);
  try {
    const info = await lstat(target);
    if (info.isSymbolicLink())
      throw new Error(`Managed file must not be a symbolic link: ${relative}`);
    if (!info.isFile())
      throw new Error(`Managed file is not a regular file: ${relative}`);
    if (info.nlink > 1)
      throw new Error(
        `Managed file must not have multiple hard links: ${relative}`,
      );
    return createHash("sha256")
      .update(await readFile(target))
      .digest("hex");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      return null;
    throw error;
  }
}

async function managedTarget(root: string, relative: string): Promise<string> {
  const target = path.resolve(root, relative);
  if (!isInside(root, target))
    throw new Error(`Managed file path escaped product root: ${relative}`);
  let ancestor = target;
  while (true) {
    try {
      if ((await lstat(ancestor)).isSymbolicLink()) {
        throw new Error(
          `Managed file path includes a symbolic link: ${relative}`,
        );
      }
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !("code" in error) ||
        error.code !== "ENOENT"
      )
        throw error;
      const parent = path.dirname(ancestor);
      if (parent === ancestor) throw error;
      ancestor = parent;
      continue;
    }
    if (ancestor === root) return target;
    ancestor = path.dirname(ancestor);
  }
}

function add(result: UpgradeResult, action: Action, relative: string): void {
  result[action].push(relative);
}

async function safelyRemove(target: string): Promise<void> {
  await rm(target, { recursive: true, force: true });
}

async function removeRegularFile(
  target: string,
  relative: string,
): Promise<void> {
  const info = await lstat(target);
  if (info.isSymbolicLink() || !info.isFile()) {
    throw new Error(
      `Managed file is not a removable regular file: ${relative}`,
    );
  }
  await unlink(target);
}

async function removeTemporaryFile(target: string): Promise<void> {
  try {
    await unlink(target);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      return;
    throw error;
  }
}

async function writeAtomically(
  destination: string,
  content: Buffer | string,
): Promise<void> {
  const temporary = path.join(
    path.dirname(destination),
    `.${path.basename(destination)}.${process.pid}.${Date.now()}.tmp`,
  );
  await writeFile(temporary, content);
  try {
    await rename(temporary, destination);
  } catch (error) {
    await removeTemporaryFile(temporary);
    throw error;
  }
}

export async function upgradeProduct(
  factoryRoot: string,
  productPath: string,
  options: {
    apply?: boolean;
    failBeforeFirstMutation?: boolean;
    failAfterMutation?: number;
    beforeManifestWrite?: () => Promise<void> | void;
  } = {},
): Promise<UpgradeResult> {
  const factory = await realpath(factoryRoot);
  const product = await realpath(productPath);
  if (isInside(factory, product) || isInside(product, factory)) {
    throw new Error("The factory and product paths must be disjoint.");
  }
  const manifestPath = path.join(product, "saasforge.manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as unknown;
  assertGenerationManifest(manifest);

  const stagingRoot = await mkdtemp(path.join(tmpdir(), "saasforge-upgrade-"));
  const stagedProduct = path.join(stagingRoot, "product");
  try {
    const target = await composeProduct(
      factory,
      manifest.product,
      stagedProduct,
      {
        updateRegistry: false,
      },
    );
    if (
      compareSemanticVersions(
        target.manifest.factory.version,
        manifest.factory.version,
      ) < 0
    ) {
      throw new Error(
        `Refusing factory downgrade from ${manifest.factory.version} to ${target.manifest.factory.version}.`,
      );
    }
    const result: UpgradeResult = {
      fromVersion: manifest.factory.version,
      toVersion: target.manifest.factory.version,
      added: [],
      updated: [],
      removed: [],
      preserved: [],
      unchanged: [],
      conflicts: [],
      applied: false,
    };
    const oldFiles = manifest.managedFiles;
    const nextFiles = target.manifest.managedFiles;
    const files = [
      ...new Set([...Object.keys(oldFiles), ...Object.keys(nextFiles)]),
    ].sort();
    for (const relative of files) {
      const oldHash = oldFiles[relative];
      const nextHash = nextFiles[relative];
      const currentHash = await fileHash(product, relative);
      if (oldHash === undefined) {
        if (currentHash === null) add(result, "added", relative);
        else if (currentHash === nextHash) add(result, "unchanged", relative);
        else add(result, "conflicts", relative);
      } else if (nextHash === undefined) {
        if (currentHash === oldHash) add(result, "removed", relative);
        else if (currentHash === null) add(result, "unchanged", relative);
        else add(result, "conflicts", relative);
      } else if (currentHash === oldHash) {
        if (oldHash === nextHash) add(result, "unchanged", relative);
        else add(result, "updated", relative);
      } else if (currentHash === nextHash) {
        add(result, "unchanged", relative);
      } else if (nextHash === oldHash) {
        add(result, "preserved", relative);
      } else {
        add(result, "conflicts", relative);
      }
    }
    if (!options.apply || result.conflicts.length) return result;

    const mutations = [...result.added, ...result.updated, ...result.removed];
    for (const relative of mutations) {
      const expected = result.added.includes(relative)
        ? null
        : oldFiles[relative];
      if ((await fileHash(product, relative)) !== expected) {
        throw new Error(`Product changed after upgrade planning: ${relative}`);
      }
    }
    const nextManifest: GenerationManifest = {
      ...target.manifest,
      generatedAt: manifest.generatedAt,
    };
    const originalManifest = await readFile(manifestPath);
    const nextManifestBytes = Buffer.from(
      `${JSON.stringify(nextManifest, null, 2)}\n`,
      "utf8",
    );
    if (!mutations.length && originalManifest.equals(nextManifestBytes))
      return result;
    const backup = path.join(stagingRoot, "backup");
    await mkdir(backup, { recursive: true });
    const journal: JournalEntry[] = [];
    let manifestWritten = false;
    try {
      if (options.failBeforeFirstMutation) {
        throw new Error(
          "Injected upgrade failure before managed-file mutation.",
        );
      }
      for (const [index, relative] of mutations.entries()) {
        const destination = await managedTarget(product, relative);
        const beforeHash = result.added.includes(relative)
          ? null
          : oldFiles[relative];
        if ((await fileHash(product, relative)) !== beforeHash) {
          throw new Error(
            `Product changed before managed-file mutation: ${relative}`,
          );
        }
        let backupPath: string | null = null;
        if (beforeHash !== null) {
          backupPath = path.join(backup, relative);
          await mkdir(path.dirname(backupPath), { recursive: true });
          await cp(destination, backupPath);
        }
        const afterHash = result.removed.includes(relative)
          ? null
          : nextFiles[relative];
        if (afterHash === null) await removeRegularFile(destination, relative);
        else {
          await mkdir(path.dirname(destination), { recursive: true });
          await writeAtomically(
            destination,
            await readFile(path.join(stagedProduct, relative)),
          );
        }
        journal.push({ relative, beforeHash, afterHash, backupPath });
        if ((await fileHash(product, relative)) !== afterHash) {
          throw new Error(
            `Managed-file mutation did not produce the expected content: ${relative}`,
          );
        }
        if (options.failAfterMutation === index + 1) {
          throw new Error(
            "Injected upgrade failure after managed-file mutation.",
          );
        }
      }
      await options.beforeManifestWrite?.();
      if (!(await readFile(manifestPath)).equals(originalManifest)) {
        throw new Error(
          "Manifest changed before final upgrade manifest write.",
        );
      }
      await writeAtomically(manifestPath, nextManifestBytes);
      manifestWritten = true;
      result.applied = true;
    } catch (error) {
      const rollbackFailures: unknown[] = [];
      for (const entry of [...journal].reverse()) {
        let destination: string;
        try {
          destination = await managedTarget(product, entry.relative);
        } catch (failure) {
          rollbackFailures.push(failure);
          continue;
        }
        try {
          if ((await fileHash(product, entry.relative)) !== entry.afterHash) {
            throw new Error(
              `Cannot safely roll back externally changed file: ${entry.relative}`,
            );
          }
          if (entry.beforeHash === null) {
            await removeRegularFile(destination, entry.relative);
          } else {
            if (!entry.backupPath)
              throw new Error(`Rollback backup is missing: ${entry.relative}`);
            await writeAtomically(
              destination,
              await readFile(entry.backupPath),
            );
          }
        } catch (failure) {
          rollbackFailures.push(failure);
        }
      }
      try {
        const currentManifest = await readFile(manifestPath);
        if (manifestWritten) {
          if (currentManifest.equals(nextManifestBytes)) {
            await writeAtomically(manifestPath, originalManifest);
          } else if (!currentManifest.equals(originalManifest)) {
            throw new Error(
              "Cannot safely roll back an externally changed manifest.",
            );
          }
        }
      } catch (failure) {
        rollbackFailures.push(failure);
      }
      if (rollbackFailures.length) {
        throw new AggregateError(
          [error, ...rollbackFailures],
          "Upgrade failed and rollback was incomplete.",
        );
      }
      throw error;
    }
    return result;
  } finally {
    await safelyRemove(stagingRoot);
  }
}
