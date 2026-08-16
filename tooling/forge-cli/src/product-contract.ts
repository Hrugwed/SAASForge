import path from "node:path";
import { z } from "zod";

export const supportedModules = [
  "auth",
  "billing",
  "email",
  "analytics",
  "jobs",
  "storage",
] as const;

export const productSlugSchema = z.string().regex(/^[a-z][a-z0-9-]{1,39}$/);

export const semanticVersionSchema = z
  .string()
  .regex(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/,
  );

const productShape = {
  name: z.string().trim().min(2).max(60),
  slug: productSlugSchema,
  description: z.string().trim().min(20).max(180),
  modules: z
    .array(z.enum(supportedModules))
    .max(supportedModules.length)
    .refine((modules) => new Set(modules).size === modules.length, {
      message: "Product modules must be unique.",
    }),
} as const;

function validateModuleDependencies(
  input: { modules: readonly (typeof supportedModules)[number][] },
  context: z.RefinementCtx,
): void {
  if (input.modules.includes("billing") && !input.modules.includes("auth")) {
    context.addIssue({
      code: "custom",
      message: "The billing module requires the auth module.",
      path: ["modules"],
    });
  }

  for (const tenantModule of ["jobs", "storage"] as const) {
    if (
      input.modules.includes(tenantModule) &&
      !input.modules.includes("auth")
    ) {
      context.addIssue({
        code: "custom",
        message: `The ${tenantModule} module requires the auth module for tenant ownership.`,
        path: ["modules"],
      });
    }
  }
}

const canonicalIsoDateSchema = z.string().refine((value) => {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}, "Expected a canonical ISO-8601 timestamp.");

export const createProductInputSchema = z
  .strictObject(productShape)
  .superRefine(validateModuleDependencies);

export type CreateProductInput = z.infer<typeof createProductInputSchema>;
export type ProductModule = CreateProductInput["modules"][number];

export const productPackageDependencies = {
  config: [],
  ui: [],
  observability: [],
  analytics: [],
  email: [],
  database: [],
  auth: ["database", "email"],
  billing: ["database"],
  jobs: [],
  storage: [],
} as const;

export type ProductPackage = keyof typeof productPackageDependencies;

export function resolveProductPackages(
  modules: readonly ProductModule[],
): ProductPackage[] {
  const selected = new Set<ProductPackage>(["config", "observability", "ui"]);
  const visit = (name: ProductPackage): void => {
    if (selected.has(name)) return;
    selected.add(name);
    for (const dependency of productPackageDependencies[name]) {
      visit(dependency);
    }
  };
  for (const moduleName of modules) visit(moduleName);
  return [...selected].sort();
}

export const productRegistryEntrySchema = z
  .strictObject({
    ...productShape,
    createdAt: canonicalIsoDateSchema,
    status: z.literal("generated"),
    mode: z.literal("standalone"),
    relativePath: z.string(),
  })
  .superRefine((entry, context) => {
    validateModuleDependencies(entry, context);
    if (entry.relativePath !== `products/${entry.slug}`) {
      context.addIssue({
        code: "custom",
        message: "Registry path must match the generated product slug.",
        path: ["relativePath"],
      });
    }
  });

export const productRegistrySchema = z
  .array(productRegistryEntrySchema)
  .max(250)
  .superRefine((entries, context) => {
    const seen = new Set<string>();
    entries.forEach((entry, index) => {
      if (seen.has(entry.slug)) {
        context.addIssue({
          code: "custom",
          message: `Registry contains duplicate slug ${entry.slug}.`,
          path: [index, "slug"],
        });
      }
      seen.add(entry.slug);
    });
  });

export type ProductRegistryEntry = z.infer<typeof productRegistryEntrySchema>;

const manifestStructureSchema = z.strictObject({
  schemaVersion: z.literal(2),
  factory: z.strictObject({
    name: z.literal("SaaSForge"),
    version: semanticVersionSchema,
    templateVersion: z.literal(2),
  }),
  product: createProductInputSchema,
  outputMode: z.literal("standalone"),
  generatedAt: canonicalIsoDateSchema,
  ownership: z.strictObject({
    application: z.literal("apps/web"),
    database: z.literal("packages/database/prisma/schema.prisma").nullable(),
    environment: z.literal("apps/web/.env.local"),
  }),
  managedFiles: z.record(z.string(), z.string()),
});

export type GenerationManifest = z.infer<typeof manifestStructureSchema>;

export function assertSafeRelativePath(
  relative: string,
  label: string,
  options: { excludeSecrets?: boolean } = {},
): void {
  const normalized = relative.replaceAll("\\", "/");
  const basename = path.posix.basename(normalized);
  if (
    !relative ||
    normalized !== relative ||
    path.posix.isAbsolute(relative) ||
    /^[a-z]:\//i.test(relative) ||
    normalized.startsWith("//") ||
    normalized
      .split("/")
      .some((part) => !part || part === "." || part === "..") ||
    (options.excludeSecrets &&
      (["pnpm-lock.yaml", "saasforge.manifest.json"].includes(relative) ||
        (basename !== ".env.example" && /^\.env(?:\..+)?$/.test(basename))))
  ) {
    throw new Error(`Manifest contains an unsafe ${label} path: ${relative}`);
  }
}

export function parseGenerationManifest(value: unknown): GenerationManifest {
  const parsed = manifestStructureSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(
      "Product manifest is not a supported SaaSForge v2 standalone manifest.",
    );
  }

  for (const [relative, hash] of Object.entries(parsed.data.managedFiles)) {
    assertSafeRelativePath(relative, "managed file", { excludeSecrets: true });
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      throw new Error(`Manifest has an invalid fingerprint for ${relative}.`);
    }
  }

  return parsed.data;
}

export function assertGenerationManifest(
  value: unknown,
): asserts value is GenerationManifest {
  parseGenerationManifest(value);
}

function parseSemanticVersion(
  version: string,
): [number, number, number, string | null] {
  const parsed = semanticVersionSchema.safeParse(version);
  if (!parsed.success) {
    throw new Error(
      `Factory version is not valid semantic version: ${version}`,
    );
  }
  const match =
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(
      parsed.data,
    );
  if (!match) {
    throw new Error(
      `Factory version is not valid semantic version: ${version}`,
    );
  }
  return [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    match[4] ?? null,
  ];
}

export function compareSemanticVersions(left: string, right: string): number {
  const [leftMajor, leftMinor, leftPatch, leftPrerelease] =
    parseSemanticVersion(left);
  const [rightMajor, rightMinor, rightPatch, rightPrerelease] =
    parseSemanticVersion(right);
  for (const index of [0, 1, 2] as const) {
    const difference =
      [leftMajor, leftMinor, leftPatch][index] -
      [rightMajor, rightMinor, rightPatch][index];
    if (difference) return Math.sign(difference);
  }
  if (leftPrerelease === rightPrerelease) return 0;
  if (leftPrerelease === null) return 1;
  if (rightPrerelease === null) return -1;
  return leftPrerelease.localeCompare(rightPrerelease, undefined, {
    numeric: true,
  });
}
