import "server-only";

import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { requireFactoryOperator } from "@/lib/factory-operator";
import {
  inspectControlPlane,
  validateControlPlaneSlug,
  type ControlPlaneProduct,
  type ControlPlaneSnapshot,
} from "./control-plane-core";

async function isFactoryRoot(candidate: string): Promise<boolean> {
  try {
    const manifestPath = path.join(candidate, "package.json");
    const info = await lstat(manifestPath);
    if (info.isSymbolicLink() || !info.isFile() || info.size > 128 * 1024) {
      return false;
    }
    const manifest = JSON.parse(
      await readFile(manifestPath, "utf8"),
    ) as unknown;
    if (
      !manifest ||
      typeof manifest !== "object" ||
      !("name" in manifest) ||
      manifest.name !== "saasforge"
    ) {
      return false;
    }
    const factoryApp = await lstat(path.join(candidate, "apps", "factory"));
    const forgeCli = await lstat(path.join(candidate, "tooling", "forge-cli"));
    return factoryApp.isDirectory() && forgeCli.isDirectory();
  } catch {
    return false;
  }
}

async function findFactoryRoot(): Promise<string> {
  let candidate = await realpath(process.cwd());
  for (let depth = 0; depth < 8; depth += 1) {
    if (await isFactoryRoot(candidate)) return candidate;
    const parent = path.dirname(candidate);
    if (parent === candidate) break;
    candidate = parent;
  }
  throw new Error("SaaSForge repository root could not be located.");
}

export async function getControlPlaneSnapshot(): Promise<ControlPlaneSnapshot> {
  await requireFactoryOperator();
  return inspectControlPlane(await findFactoryRoot());
}

export async function getControlPlaneProduct(
  rawSlug: string,
): Promise<ControlPlaneProduct | null> {
  const slug = validateControlPlaneSlug(rawSlug);
  if (!slug) return null;
  const snapshot = await getControlPlaneSnapshot();
  return snapshot.products.find((product) => product.slug === slug) ?? null;
}
