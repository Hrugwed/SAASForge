import {
  appendFile,
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const supportedModules = ["auth", "billing", "email", "analytics"] as const;

export const createProductInputSchema = z
  .object({
    name: z.string().trim().min(2).max(60),
    slug: z.string().regex(/^[a-z][a-z0-9-]{1,39}$/),
    description: z.string().trim().min(20).max(180),
    modules: z.array(z.enum(supportedModules)).max(supportedModules.length),
  })
  .superRefine((input, context) => {
    if (input.modules.includes("billing") && !input.modules.includes("auth")) {
      context.addIssue({
        code: "custom",
        message: "The billing module requires the auth module.",
        path: ["modules"],
      });
    }
  });

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

type ProductRegistryEntry = CreateProductInput & {
  createdAt: string;
  status: "generated";
};

function assertInside(parent: string, target: string): void {
  const relative = path.relative(parent, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(
      "The generated product path escaped the products directory.",
    );
  }
}

async function exists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function replaceTokens(
  directory: string,
  tokens: Record<string, string>,
) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await replaceTokens(target, tokens);
      continue;
    }

    const extension = path.extname(entry.name);
    if (
      ![".ts", ".tsx", ".json", ".md", ".css", ".example"].includes(extension)
    ) {
      continue;
    }

    const source = await readFile(target, "utf8");
    const replaced = Object.entries(tokens).reduce(
      (content, [token, value]) => content.replaceAll(token, value),
      source,
    );
    if (replaced !== source) await writeFile(target, replaced, "utf8");
  }
}

async function updatePackageManifest(
  target: string,
  modules: CreateProductInput["modules"],
) {
  const manifestPath = path.join(target, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
    dependencies: Record<string, string>;
  };

  if (modules.includes("auth")) {
    manifest.dependencies["@saasforge/auth"] = "workspace:*";
    manifest.dependencies["@saasforge/database"] = "workspace:*";
    manifest.dependencies["better-auth"] = "^1.6.26";
    manifest.dependencies["server-only"] = "0.0.1";
  }
  if (modules.includes("billing")) {
    manifest.dependencies["@saasforge/billing"] = "workspace:*";
  }
  if (modules.includes("email")) {
    manifest.dependencies["@saasforge/email"] = "workspace:*";
  }
  if (modules.includes("analytics")) {
    manifest.dependencies["@saasforge/analytics"] = "workspace:*";
  }

  manifest.dependencies = Object.fromEntries(
    Object.entries(manifest.dependencies).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
  await writeFile(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

async function appendModuleEnvironment(
  target: string,
  modules: CreateProductInput["modules"],
) {
  const sections: string[] = [];
  if (modules.includes("auth")) {
    sections.push(`
# Authentication and isolated product database
DATABASE_URL=postgresql://replace-me
BETTER_AUTH_SECRET=replace-with-at-least-32-random-characters
BETTER_AUTH_URL=http://localhost:3100
`);
  }
  if (modules.includes("billing")) {
    sections.push(`
# Stripe sandbox values for this product only
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_DEFAULT=
`);
  }
  if (sections.length > 0) {
    await appendFile(
      path.join(target, ".env.example"),
      sections.join(""),
      "utf8",
    );
  }
}

async function updateRegistry(
  root: string,
  entry: ProductRegistryEntry,
): Promise<void> {
  const registryPath = path.join(
    root,
    "apps",
    "factory",
    "src",
    "generated",
    "products.json",
  );
  await mkdir(path.dirname(registryPath), { recursive: true });
  const registry = (await exists(registryPath))
    ? (JSON.parse(
        await readFile(registryPath, "utf8"),
      ) as ProductRegistryEntry[])
    : [];
  if (registry.some((product) => product.slug === entry.slug)) {
    throw new Error(`Product registry already contains ${entry.slug}.`);
  }
  registry.push(entry);
  registry.sort((left, right) => left.slug.localeCompare(right.slug));
  await writeFile(
    registryPath,
    `${JSON.stringify(registry, null, 2)}\n`,
    "utf8",
  );
}

export async function createProduct(
  repositoryRoot: string,
  rawInput: CreateProductInput,
): Promise<{ target: string; input: CreateProductInput }> {
  const input = createProductInputSchema.parse(rawInput);
  const productsRoot = path.resolve(repositoryRoot, "products");
  const target = path.resolve(productsRoot, input.slug);
  assertInside(productsRoot, target);
  if (await exists(target)) {
    throw new Error(`Product directory already exists: ${target}`);
  }

  const templateRoot = path.resolve(
    repositoryRoot,
    "templates",
    "saas-product",
  );
  const baseTemplate = path.join(templateRoot, "base");
  await mkdir(productsRoot, { recursive: true });
  try {
    await cp(baseTemplate, target, { recursive: true, errorOnExist: true });

    for (const moduleName of input.modules) {
      const moduleTemplate = path.join(templateRoot, "modules", moduleName);
      if (await exists(moduleTemplate)) {
        await cp(moduleTemplate, target, { recursive: true, force: false });
      }
    }

    const modules = new Set(input.modules);
    const transpilePackages = [
      "@saasforge/config",
      "@saasforge/ui",
      ...(modules.has("auth")
        ? ["@saasforge/auth", "@saasforge/database"]
        : []),
      ...(modules.has("billing") ? ["@saasforge/billing"] : []),
      ...(modules.has("email") ? ["@saasforge/email"] : []),
      ...(modules.has("analytics") ? ["@saasforge/analytics"] : []),
    ];
    await replaceTokens(target, {
      __PRODUCT_NAME__: input.name,
      __PRODUCT_SLUG__: input.slug,
      __PRODUCT_DESCRIPTION__: input.description,
      __AUTH_ENABLED__: String(modules.has("auth")),
      __BILLING_ENABLED__: String(modules.has("billing")),
      __EMAIL_ENABLED__: String(modules.has("email")),
      __ANALYTICS_ENABLED__: String(modules.has("analytics")),
      __TRANSPILE_PACKAGES__: transpilePackages
        .map((packageName) => `"${packageName}"`)
        .join(", "),
    });
    await updatePackageManifest(target, input.modules);
    await appendModuleEnvironment(target, input.modules);
    await updateRegistry(repositoryRoot, {
      ...input,
      createdAt: new Date().toISOString(),
      status: "generated",
    });
  } catch (error) {
    await rm(target, { recursive: true, force: true });
    throw error;
  }

  return { target, input };
}
