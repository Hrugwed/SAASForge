import {
  createProductBlueprintDocument,
  createProductInputSchema,
  encodeProductBlueprint,
  modulesRequiringAuth,
  resolveProductPackages,
  supportedModules,
} from "@saasforge/forge-cli/product-blueprint";
import type {
  ProductBlueprintDocument,
  ProductModule,
  ProductPackage,
} from "@saasforge/forge-cli/product-blueprint";

export type BlueprintDraft = {
  name: string;
  slug: string;
  description: string;
  modules: ProductModule[];
};

type BlueprintField = keyof BlueprintDraft;

export type BlueprintExport =
  | {
      valid: false;
      errors: Partial<Record<BlueprintField, readonly string[]>>;
    }
  | {
      valid: true;
      document: ProductBlueprintDocument;
      json: string;
      command: string;
      packages: ProductPackage[];
    };

export function slugifyProductName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

export function toggleProductModule(
  current: readonly ProductModule[],
  moduleName: ProductModule,
): ProductModule[] {
  const selected = new Set(current);
  const requiresAuth = modulesRequiringAuth.some((requiredModule) =>
    selected.has(requiredModule),
  );
  if (moduleName === "auth" && selected.has("auth") && requiresAuth) {
    return supportedModules.filter((candidate) => selected.has(candidate));
  }

  if (selected.has(moduleName)) selected.delete(moduleName);
  else selected.add(moduleName);
  if (modulesRequiringAuth.some((candidate) => candidate === moduleName)) {
    selected.add("auth");
  }

  return supportedModules.filter((candidate) => selected.has(candidate));
}

export function buildBlueprintExport(draft: BlueprintDraft): BlueprintExport {
  const result = createProductInputSchema.safeParse(draft);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  const document = createProductBlueprintDocument(result.data);
  const encoded = encodeProductBlueprint(result.data);
  return {
    valid: true,
    document,
    json: `${JSON.stringify(document, null, 2)}\n`,
    command: `pnpm forge:create -- --blueprint ${encoded}`,
    packages: resolveProductPackages(result.data.modules),
  };
}
