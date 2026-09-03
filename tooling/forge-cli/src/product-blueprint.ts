import { z } from "zod";

export const supportedModules = [
  "auth",
  "billing",
  "email",
  "analytics",
  "jobs",
  "storage",
] as const;

export const modulesRequiringAuth = ["billing", "jobs", "storage"] as const;

export const productSlugSchema = z.string().regex(/^[a-z][a-z0-9-]{1,39}$/);

export const productInputShape = {
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

export function addModuleDependencyIssues(
  input: { modules: readonly (typeof supportedModules)[number][] },
  context: z.RefinementCtx,
): void {
  for (const moduleName of modulesRequiringAuth) {
    if (input.modules.includes(moduleName) && !input.modules.includes("auth")) {
      context.addIssue({
        code: "custom",
        message:
          moduleName === "billing"
            ? "The billing module requires the auth module."
            : `The ${moduleName} module requires the auth module for tenant ownership.`,
        path: ["modules"],
      });
    }
  }
}

export const createProductInputSchema = z
  .strictObject(productInputShape)
  .superRefine(addModuleDependencyIssues);

export type CreateProductInput = z.infer<typeof createProductInputSchema>;
export type ProductModule = CreateProductInput["modules"][number];

export const productBlueprintDocumentSchema = z.strictObject({
  schemaVersion: z.literal(1),
  outputMode: z.literal("standalone"),
  product: createProductInputSchema,
});

export type ProductBlueprintDocument = z.infer<
  typeof productBlueprintDocumentSchema
>;

export function createProductBlueprintDocument(
  input: CreateProductInput,
): ProductBlueprintDocument {
  return productBlueprintDocumentSchema.parse({
    schemaVersion: 1,
    outputMode: "standalone",
    product: input,
  });
}

export function encodeProductBlueprint(input: CreateProductInput): string {
  const document = createProductBlueprintDocument(input);
  const bytes = new TextEncoder().encode(JSON.stringify(document));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

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
