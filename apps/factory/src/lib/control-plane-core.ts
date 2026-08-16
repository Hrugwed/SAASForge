import { lstat, open, realpath } from "node:fs/promises";
import type { Stats } from "node:fs";
import path from "node:path";
import {
  compareSemanticVersions,
  parseGenerationManifest,
  productRegistryEntrySchema,
  productSlugSchema,
  resolveProductPackages,
  semanticVersionSchema,
  type ProductModule,
  type ProductRegistryEntry,
} from "@saasforge/forge-cli/product-contract";

const MAX_REGISTRY_BYTES = 512 * 1024;
const MAX_MANIFEST_BYTES = 2 * 1024 * 1024;
const MAX_REGISTRY_ENTRIES = 250;

type ArtifactDefinition = {
  key: string;
  label: string;
  relative: string;
  kind: "file" | "directory";
};

const baseArtifactDefinitions = [
  {
    key: "application",
    label: "Product application",
    relative: "apps/web",
    kind: "directory",
  },
  {
    key: "package-manifest",
    label: "Package manifest",
    relative: "package.json",
    kind: "file",
  },
  {
    key: "agent-guide",
    label: "Agent instructions",
    relative: "AGENTS.md",
    kind: "file",
  },
  {
    key: "doctor",
    label: "Product doctor",
    relative: "scripts/doctor.mjs",
    kind: "file",
  },
  {
    key: "operations",
    label: "Operations documentation",
    relative: "docs",
    kind: "directory",
  },
] as const satisfies readonly ArtifactDefinition[];

function artifactDefinitionsFor(
  modules: readonly ProductModule[],
): ArtifactDefinition[] {
  return [
    ...baseArtifactDefinitions,
    ...resolveProductPackages(modules).map((packageName) => ({
      key: `package-${packageName}`,
      label: `${packageName} capability package`,
      relative: `packages/${packageName}`,
      kind: "directory" as const,
    })),
  ];
}

export type ControlPlaneIssueCode =
  | "registry-missing"
  | "registry-unsafe"
  | "registry-oversized"
  | "registry-malformed"
  | "registry-entry-invalid"
  | "registry-duplicate";

export type ControlPlaneIssue = {
  code: ControlPlaneIssueCode;
  message: string;
};

export type ArtifactState = "present" | "missing" | "unsafe";

export type ControlPlaneArtifact = {
  key: string;
  label: string;
  state: ArtifactState;
};

export type ProductEvidenceState = "tracked" | "review-required" | "attention";

export type ProductVersionState = "current" | "behind" | "ahead" | "unknown";

export type ProductInspectionCode =
  | "verified"
  | "artifact-incomplete"
  | "products-root-missing"
  | "path-missing"
  | "path-unsafe"
  | "manifest-missing"
  | "manifest-unsafe"
  | "manifest-malformed"
  | "identity-mismatch";

export type ProductSignal = {
  key: "analytics" | "revenue" | "errors" | "deployment";
  label: string;
  provider: string;
  state: "not-selected" | "product-owned" | "unverified";
};

export type ProductIdentitySource = "manifest-verified" | "registry-unverified";

export type ControlPlaneProduct = {
  name: string;
  slug: string;
  description: string;
  modules: readonly ProductModule[];
  createdAt: string;
  identitySource: ProductIdentitySource;
  evidenceState: ProductEvidenceState;
  inspectionCode: ProductInspectionCode;
  inspectionMessage: string;
  generatedWith: string | null;
  currentFactoryVersion: string;
  versionState: ProductVersionState;
  templateVersion: number | null;
  managedFileCount: number | null;
  artifacts: readonly ControlPlaneArtifact[];
  signals: readonly ProductSignal[];
};

export type ControlPlaneSnapshot = {
  factoryVersion: string;
  products: readonly ControlPlaneProduct[];
  issues: readonly ControlPlaneIssue[];
  counts: {
    registered: number;
    manifestVerified: number;
    tracked: number;
    reviewRequired: number;
    attention: number;
    selectedModules: number;
  };
};

class UnsafePathError extends Error {}
class MissingPathError extends Error {}
class OversizedFileError extends Error {}

function isMissingError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function samePath(left: string, right: string): boolean {
  return path.relative(left, right) === "";
}

function sameFile(left: Stats, right: Stats): boolean {
  return (
    left.ino === right.ino &&
    (process.platform === "win32" || left.dev === right.dev)
  );
}

function isInside(parent: string, target: string): boolean {
  const relative = path.relative(parent, target);
  return (
    Boolean(relative) &&
    !relative.startsWith("..") &&
    !path.isAbsolute(relative)
  );
}

async function safeLstat(target: string): Promise<Stats | null> {
  try {
    return await lstat(target);
  } catch (error) {
    if (isMissingError(error)) return null;
    throw error;
  }
}

async function readBoundedRegularFile(
  target: string,
  maximumBytes: number,
  containmentRoot: string,
): Promise<string> {
  const resolvedRoot = path.resolve(containmentRoot);
  const resolvedTarget = path.resolve(target);
  if (!isInside(resolvedRoot, resolvedTarget)) {
    throw new UnsafePathError("Required file escaped its inspection root.");
  }

  const parent = path.dirname(resolvedTarget);
  const relativeParent = path.relative(resolvedRoot, parent);
  let cursor = resolvedRoot;
  for (const segment of relativeParent.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const directoryInfo = await safeLstat(cursor);
    if (
      !directoryInfo ||
      directoryInfo.isSymbolicLink() ||
      !directoryInfo.isDirectory()
    ) {
      throw new UnsafePathError("Required file has an unsafe ancestor.");
    }
  }

  const [realRoot, realParent] = await Promise.all([
    realpath(resolvedRoot),
    realpath(parent),
  ]);
  if (
    !samePath(
      realParent,
      path.join(realRoot, path.relative(resolvedRoot, parent)),
    )
  ) {
    throw new UnsafePathError("Required file has an unsafe ancestor.");
  }

  const info = await safeLstat(target);
  if (!info) throw new MissingPathError("Required file is missing.");
  if (info.isSymbolicLink() || !info.isFile() || info.nlink > 1) {
    throw new UnsafePathError("Required file is not an isolated regular file.");
  }
  if (info.size > maximumBytes) {
    throw new OversizedFileError("Required file exceeds the inspection limit.");
  }
  const handle = await open(target, "r");
  try {
    const openedInfo = await handle.stat();
    if (
      !sameFile(info, openedInfo) ||
      !openedInfo.isFile() ||
      openedInfo.nlink > 1
    ) {
      throw new UnsafePathError("Required file changed during inspection.");
    }
    if (openedInfo.size > maximumBytes) {
      throw new OversizedFileError(
        "Required file exceeds the inspection limit.",
      );
    }

    const buffer = Buffer.alloc(maximumBytes + 1);
    let total = 0;
    while (total <= maximumBytes) {
      const { bytesRead } = await handle.read(
        buffer,
        total,
        maximumBytes + 1 - total,
        null,
      );
      if (bytesRead === 0) break;
      total += bytesRead;
    }
    if (total > maximumBytes) {
      throw new OversizedFileError(
        "Required file exceeds the inspection limit.",
      );
    }
    return buffer.subarray(0, total).toString("utf8");
  } finally {
    await handle.close();
  }
}

async function assertSafeProductDirectory(
  factoryRoot: string,
  slug: string,
): Promise<string> {
  const productsRoot = path.join(factoryRoot, "products");
  const productRoot = path.join(productsRoot, slug);
  const productsInfo = await safeLstat(productsRoot);
  if (!productsInfo) throw new MissingPathError("Products root is missing.");
  if (productsInfo.isSymbolicLink() || !productsInfo.isDirectory()) {
    throw new UnsafePathError("Products root is not a real directory.");
  }

  const productInfo = await safeLstat(productRoot);
  if (!productInfo) throw new MissingPathError("Product directory is missing.");
  if (productInfo.isSymbolicLink() || !productInfo.isDirectory()) {
    throw new UnsafePathError("Product path is not a real directory.");
  }

  const [realFactory, realProducts, realProduct] = await Promise.all([
    realpath(factoryRoot),
    realpath(productsRoot),
    realpath(productRoot),
  ]);
  if (
    !samePath(realProducts, path.join(realFactory, "products")) ||
    !isInside(realProducts, realProduct)
  ) {
    throw new UnsafePathError(
      "Product path escaped the factory products root.",
    );
  }
  return productRoot;
}

async function inspectArtifact(
  productRoot: string,
  definition: ArtifactDefinition,
): Promise<ControlPlaneArtifact> {
  const parts = definition.relative.split("/");
  let target = productRoot;
  for (const [index, part] of parts.entries()) {
    target = path.join(target, part);
    const info = await safeLstat(target);
    if (!info) {
      return { key: definition.key, label: definition.label, state: "missing" };
    }
    if (info.isSymbolicLink()) {
      return { key: definition.key, label: definition.label, state: "unsafe" };
    }
    if (index < parts.length - 1 && !info.isDirectory()) {
      return { key: definition.key, label: definition.label, state: "unsafe" };
    }
    if (
      index === parts.length - 1 &&
      ((definition.kind === "file" && (!info.isFile() || info.nlink > 1)) ||
        (definition.kind === "directory" && !info.isDirectory()))
    ) {
      return { key: definition.key, label: definition.label, state: "unsafe" };
    }
  }
  return { key: definition.key, label: definition.label, state: "present" };
}

function productSignals(
  modules: readonly ProductModule[],
  identityVerified: boolean,
): ProductSignal[] {
  if (!identityVerified) {
    return [
      {
        key: "analytics",
        label: "Product analytics",
        provider: "PostHog",
        state: "unverified",
      },
      {
        key: "revenue",
        label: "Revenue signals",
        provider: "Stripe",
        state: "unverified",
      },
      {
        key: "errors",
        label: "Error monitoring",
        provider: "Sentry",
        state: "unverified",
      },
      {
        key: "deployment",
        label: "Deployment state",
        provider: "Vercel",
        state: "unverified",
      },
    ];
  }
  return [
    {
      key: "analytics",
      label: "Product analytics",
      provider: "PostHog",
      state: modules.includes("analytics") ? "product-owned" : "not-selected",
    },
    {
      key: "revenue",
      label: "Revenue signals",
      provider: "Stripe",
      state: modules.includes("billing") ? "product-owned" : "not-selected",
    },
    {
      key: "errors",
      label: "Error monitoring",
      provider: "Sentry",
      state: "product-owned",
    },
    {
      key: "deployment",
      label: "Deployment state",
      provider: "Vercel",
      state: "product-owned",
    },
  ];
}

function unresolvedProduct(
  entry: ProductRegistryEntry,
  factoryVersion: string,
  code: Exclude<ProductInspectionCode, "verified">,
  message: string,
): ControlPlaneProduct {
  return {
    name: entry.name,
    slug: entry.slug,
    description: entry.description,
    modules: entry.modules,
    createdAt: entry.createdAt,
    identitySource: "registry-unverified",
    evidenceState: "attention",
    inspectionCode: code,
    inspectionMessage: message,
    generatedWith: null,
    currentFactoryVersion: factoryVersion,
    versionState: "unknown",
    templateVersion: null,
    managedFileCount: null,
    artifacts: artifactDefinitionsFor(entry.modules).map((artifact) => ({
      key: artifact.key,
      label: artifact.label,
      state: "missing" as const,
    })),
    signals: productSignals(entry.modules, false),
  };
}

async function inspectProduct(
  factoryRoot: string,
  factoryVersion: string,
  entry: ProductRegistryEntry,
): Promise<ControlPlaneProduct> {
  let productRoot: string;
  try {
    productRoot = await assertSafeProductDirectory(factoryRoot, entry.slug);
  } catch (error) {
    if (error instanceof MissingPathError) {
      const productsRootExists = Boolean(
        await safeLstat(path.join(factoryRoot, "products")),
      );
      return unresolvedProduct(
        entry,
        factoryVersion,
        productsRootExists ? "path-missing" : "products-root-missing",
        productsRootExists
          ? "The registered product directory is missing."
          : "The local products directory is missing.",
      );
    }
    if (error instanceof UnsafePathError) {
      return unresolvedProduct(
        entry,
        factoryVersion,
        "path-unsafe",
        "The registered product path failed containment checks.",
      );
    }
    throw error;
  }

  const manifestPath = path.join(productRoot, "saasforge.manifest.json");
  let manifestSource: string;
  try {
    manifestSource = await readBoundedRegularFile(
      manifestPath,
      MAX_MANIFEST_BYTES,
      productRoot,
    );
  } catch (error) {
    if (error instanceof MissingPathError) {
      return unresolvedProduct(
        entry,
        factoryVersion,
        "manifest-missing",
        "The generated manifest is missing.",
      );
    }
    if (
      error instanceof UnsafePathError ||
      error instanceof OversizedFileError
    ) {
      return unresolvedProduct(
        entry,
        factoryVersion,
        "manifest-unsafe",
        "The generated manifest failed safe-file checks.",
      );
    }
    throw error;
  }

  let manifest: ReturnType<typeof parseGenerationManifest>;
  try {
    manifest = parseGenerationManifest(JSON.parse(manifestSource) as unknown);
  } catch {
    return unresolvedProduct(
      entry,
      factoryVersion,
      "manifest-malformed",
      "The generated manifest is not a supported SaaSForge v2 manifest.",
    );
  }

  const identityMatches =
    manifest.product.name === entry.name &&
    manifest.product.slug === entry.slug &&
    manifest.product.description === entry.description &&
    manifest.generatedAt === entry.createdAt &&
    JSON.stringify(manifest.product.modules) === JSON.stringify(entry.modules);
  if (!identityMatches) {
    return unresolvedProduct(
      entry,
      factoryVersion,
      "identity-mismatch",
      "The registry and generated manifest do not describe the same product.",
    );
  }

  const artifacts = await Promise.all(
    artifactDefinitionsFor(manifest.product.modules).map((artifact) =>
      inspectArtifact(productRoot, artifact),
    ),
  );
  const comparison = compareSemanticVersions(
    manifest.factory.version,
    factoryVersion,
  );
  const versionState: ProductVersionState =
    comparison === 0 ? "current" : comparison < 0 ? "behind" : "ahead";
  const artifactsComplete = artifacts.every(
    (artifact) => artifact.state === "present",
  );

  return {
    name: manifest.product.name,
    slug: manifest.product.slug,
    description: manifest.product.description,
    modules: manifest.product.modules,
    createdAt: manifest.generatedAt,
    identitySource: "manifest-verified",
    evidenceState: !artifactsComplete
      ? "attention"
      : versionState === "current"
        ? "tracked"
        : "review-required",
    inspectionCode: artifactsComplete ? "verified" : "artifact-incomplete",
    inspectionMessage: artifactsComplete
      ? "Registry identity and generated manifest agree."
      : "The manifest is valid, but one or more expected artifacts need attention.",
    generatedWith: manifest.factory.version,
    currentFactoryVersion: factoryVersion,
    versionState,
    templateVersion: manifest.factory.templateVersion,
    managedFileCount: Object.keys(manifest.managedFiles).length,
    artifacts,
    signals: productSignals(manifest.product.modules, true),
  };
}

async function readRegistry(factoryRoot: string): Promise<{
  entries: ProductRegistryEntry[];
  issues: ControlPlaneIssue[];
}> {
  const registryPath = path.join(
    factoryRoot,
    "apps",
    "factory",
    "src",
    "generated",
    "products.json",
  );
  let source: string;
  try {
    source = await readBoundedRegularFile(
      registryPath,
      MAX_REGISTRY_BYTES,
      factoryRoot,
    );
  } catch (error) {
    if (error instanceof MissingPathError) {
      return {
        entries: [],
        issues: [
          {
            code: "registry-missing",
            message: "The generated product registry is missing.",
          },
        ],
      };
    }
    return {
      entries: [],
      issues: [
        {
          code:
            error instanceof OversizedFileError
              ? "registry-oversized"
              : "registry-unsafe",
          message:
            error instanceof OversizedFileError
              ? "The generated product registry exceeds the inspection limit."
              : "The generated product registry failed safe-file checks.",
        },
      ],
    };
  }

  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch {
    return {
      entries: [],
      issues: [
        {
          code: "registry-malformed",
          message: "The generated product registry is not valid JSON.",
        },
      ],
    };
  }
  if (!Array.isArray(value)) {
    return {
      entries: [],
      issues: [
        {
          code: "registry-malformed",
          message: "The generated product registry must be an array.",
        },
      ],
    };
  }
  if (value.length > MAX_REGISTRY_ENTRIES) {
    return {
      entries: [],
      issues: [
        {
          code: "registry-oversized",
          message: "The generated product registry contains too many entries.",
        },
      ],
    };
  }

  const entries: ProductRegistryEntry[] = [];
  const issues: ControlPlaneIssue[] = [];
  const seen = new Set<string>();
  value.forEach((candidate, index) => {
    const parsed = productRegistryEntrySchema.safeParse(candidate);
    if (!parsed.success) {
      issues.push({
        code: "registry-entry-invalid",
        message: `Registry entry ${index + 1} failed validation.`,
      });
      return;
    }
    if (seen.has(parsed.data.slug)) {
      issues.push({
        code: "registry-duplicate",
        message: `Registry entry ${index + 1} duplicates an earlier product slug.`,
      });
      return;
    }
    seen.add(parsed.data.slug);
    entries.push(parsed.data);
  });
  return { entries, issues };
}

async function readFactoryVersion(factoryRoot: string): Promise<string> {
  const source = await readBoundedRegularFile(
    path.join(factoryRoot, "package.json"),
    128 * 1024,
    factoryRoot,
  );
  const value = JSON.parse(source) as unknown;
  if (!value || typeof value !== "object" || !("version" in value)) {
    throw new Error("Factory package version is unavailable.");
  }
  return semanticVersionSchema.parse(value.version);
}

export async function inspectControlPlane(
  factoryRoot: string,
): Promise<ControlPlaneSnapshot> {
  const root = await realpath(path.resolve(factoryRoot));
  const factoryVersion = await readFactoryVersion(root);
  const registry = await readRegistry(root);
  const products = await Promise.all(
    registry.entries.map((entry) =>
      inspectProduct(root, factoryVersion, entry),
    ),
  );
  const selectedModules = new Set(
    products
      .filter((product) => product.identitySource === "manifest-verified")
      .flatMap((product) => [...product.modules]),
  ).size;
  return {
    factoryVersion,
    products,
    issues: registry.issues,
    counts: {
      registered: products.length,
      manifestVerified: products.filter(
        (product) => product.identitySource === "manifest-verified",
      ).length,
      tracked: products.filter((product) => product.evidenceState === "tracked")
        .length,
      reviewRequired: products.filter(
        (product) => product.evidenceState === "review-required",
      ).length,
      attention: products.filter(
        (product) => product.evidenceState === "attention",
      ).length,
      selectedModules,
    },
  };
}

export function validateControlPlaneSlug(value: string): string | null {
  const parsed = productSlugSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
