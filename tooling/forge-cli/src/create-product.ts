import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { format } from "prettier";
import { z } from "zod";

export const supportedModules = [
  "auth",
  "billing",
  "email",
  "analytics",
] as const;

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
  mode: "standalone";
  relativePath: string;
};

type GenerationManifest = {
  schemaVersion: 1;
  factory: { name: "SaaSForge"; version: string; templateVersion: 1 };
  product: CreateProductInput;
  outputMode: "standalone";
  generatedAt: string;
  ownership: {
    application: "apps/web";
    database: "packages/database/prisma/schema.prisma" | null;
    environment: "apps/web/.env.local";
  };
};

const packageDependencies = {
  config: [],
  ui: [],
  analytics: [],
  email: [],
  database: [],
  auth: ["database"],
  billing: ["database"],
} as const;

type FactoryPackage = keyof typeof packageDependencies;

function assertInside(parent: string, target: string): void {
  const relative = path.relative(parent, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
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
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      return false;
    throw error;
  }
}

async function replaceTokens(
  directory: string,
  tokens: Record<string, string>,
): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await replaceTokens(target, tokens);
      continue;
    }

    const extension = path.extname(entry.name);
    if (
      ![".ts", ".tsx", ".json", ".md", ".css", ".example"].includes(extension)
    )
      continue;

    const source = await readFile(target, "utf8");
    const replaced = Object.entries(tokens).reduce(
      (content, [token, value]) => content.replaceAll(token, value),
      source,
    );
    if (replaced !== source) await writeFile(target, replaced, "utf8");
  }
}

async function formatGeneratedFiles(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await formatGeneratedFiles(target);
      continue;
    }
    if (
      ![".ts", ".tsx", ".json", ".md", ".css", ".yaml", ".yml"].includes(
        path.extname(entry.name),
      )
    )
      continue;
    const source = await readFile(target, "utf8");
    await writeFile(target, await format(source, { filepath: target }), "utf8");
  }
}

function selectedPackages(
  modules: CreateProductInput["modules"],
): FactoryPackage[] {
  const selected = new Set<FactoryPackage>(["config", "ui"]);
  const visit = (name: FactoryPackage) => {
    if (selected.has(name)) return;
    selected.add(name);
    for (const dependency of packageDependencies[name]) visit(dependency);
  };
  for (const moduleName of modules) visit(moduleName);
  return [...selected].sort();
}

function copyFilter(source: string): boolean {
  const name = path.basename(source);
  return !["node_modules", ".turbo", "coverage", "dist", "generated"].includes(
    name,
  );
}

async function updatePackageManifest(
  appTarget: string,
  modules: CreateProductInput["modules"],
): Promise<void> {
  const manifestPath = path.join(appTarget, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
    dependencies: Record<string, string>;
  };

  if (modules.includes("auth")) {
    manifest.dependencies["@saasforge/auth"] = "workspace:*";
    manifest.dependencies["@saasforge/database"] = "workspace:*";
    manifest.dependencies["better-auth"] = "^1.6.26";
    manifest.dependencies["server-only"] = "0.0.1";
  }
  if (modules.includes("billing"))
    manifest.dependencies["@saasforge/billing"] = "workspace:*";
  if (modules.includes("email"))
    manifest.dependencies["@saasforge/email"] = "workspace:*";
  if (modules.includes("analytics"))
    manifest.dependencies["@saasforge/analytics"] = "workspace:*";

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
  appTarget: string,
  modules: CreateProductInput["modules"],
): Promise<void> {
  const sections: string[] = [];
  if (modules.includes("auth")) {
    sections.push(`
# Authentication and this product's isolated database
DATABASE_URL=postgresql://replace-me
BETTER_AUTH_SECRET=replace-with-at-least-32-random-characters
BETTER_AUTH_URL=http://localhost:3100
`);
  }
  if (modules.includes("billing")) {
    sections.push(`
# Stripe sandbox values owned by this product
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_DEFAULT=
`);
  }
  if (sections.length === 0) return;
  const environmentPath = path.join(appTarget, ".env.example");
  const current = await readFile(environmentPath, "utf8");
  await writeFile(
    environmentPath,
    `${current.trimEnd()}\n${sections.join("")}\n`,
    "utf8",
  );
}

async function writeRepositoryFiles(
  target: string,
  input: CreateProductInput,
  factoryVersion: string,
  packages: FactoryPackage[],
  generatedAt: string,
): Promise<void> {
  const hasDatabase = packages.includes("database");
  const rootManifest = {
    name: input.slug,
    version: "0.1.0",
    private: true,
    packageManager: "pnpm@10.28.2",
    engines: { node: ">=22.14.0" },
    scripts: {
      build: "turbo run build",
      dev: "turbo run dev",
      lint: "turbo run lint",
      typecheck: "turbo run typecheck",
      test: "turbo run test",
      "test:e2e": "turbo run test:e2e",
      format: "prettier --write .",
      "format:check": "prettier --check .",
      ...(hasDatabase
        ? {
            "db:generate": "pnpm --filter @saasforge/database db:generate",
            "db:deploy": "pnpm --filter @saasforge/database db:deploy",
            "db:validate": "pnpm --filter @saasforge/database db:validate",
          }
        : {}),
    },
    devDependencies: {
      prettier: "^3.6.2",
      turbo: "^2.5.6",
      typescript: "^5.9.2",
    },
    pnpm: {
      onlyBuiltDependencies: [
        "@prisma/engines",
        "esbuild",
        "prisma",
        "sharp",
        "unrs-resolver",
      ],
    },
  };
  const manifest: GenerationManifest = {
    schemaVersion: 1,
    factory: { name: "SaaSForge", version: factoryVersion, templateVersion: 1 },
    product: input,
    outputMode: "standalone",
    generatedAt,
    ownership: {
      application: "apps/web",
      database: hasDatabase ? "packages/database/prisma/schema.prisma" : null,
      environment: "apps/web/.env.local",
    },
  };

  await writeFile(
    path.join(target, "package.json"),
    `${JSON.stringify(rootManifest, null, 2)}\n`,
  );
  await writeFile(
    path.join(target, "saasforge.manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await writeFile(
    path.join(target, "pnpm-workspace.yaml"),
    'packages:\n  - "apps/*"\n  - "packages/*"\n',
  );
  await writeFile(
    path.join(target, ".gitignore"),
    "node_modules/\n.pnpm-store/\n.next/\ndist/\ncoverage/\n.turbo/\nplaywright-report/\ntest-results/\n.env\n.env.*\n!.env.example\n*.tsbuildinfo\npackages/database/src/generated/\n",
  );
  await writeFile(
    path.join(target, ".prettierignore"),
    "pnpm-lock.yaml\npackages/database/src/generated/\n",
  );
  await writeFile(
    path.join(target, "AGENTS.md"),
    `# ${input.name} engineering guide\n\nThis is an independent product generated by SaaSForge ${factoryVersion}. Read \`saasforge.manifest.json\` before structural changes. Product logic belongs in \`apps/web\`; reusable capability contracts live in \`packages\`. Never share this product's database, secrets, billing, domain, storage, or deployment with another product by default. Authenticate and authorize on the server, scope tenant data by organization, validate external input, verify webhooks, add migrations for schema changes, and run formatting, lint, types, tests, and build before handoff.\n`,
  );
  await writeFile(path.join(target, "CLAUDE.md"), "@AGENTS.md\n");
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
  options: { now?: () => Date } = {},
): Promise<{
  target: string;
  input: CreateProductInput;
  manifest: GenerationManifest;
}> {
  const input = createProductInputSchema.parse(rawInput);
  const productsRoot = path.resolve(repositoryRoot, "products");
  const target = path.resolve(productsRoot, input.slug);
  assertInside(productsRoot, target);
  if (await exists(target))
    throw new Error(`Product directory already exists: ${target}`);

  const factoryManifest = JSON.parse(
    await readFile(path.join(repositoryRoot, "package.json"), "utf8"),
  ) as {
    version?: string;
  };
  const factoryVersion = factoryManifest.version ?? "0.0.0";
  const generatedAt = (options.now?.() ?? new Date()).toISOString();
  const templateRoot = path.resolve(
    repositoryRoot,
    "templates",
    "saas-product",
  );
  const appTarget = path.join(target, "apps", "web");
  const packages = selectedPackages(input.modules);

  await mkdir(productsRoot, { recursive: true });
  try {
    await mkdir(path.dirname(appTarget), { recursive: true });
    await cp(path.join(templateRoot, "base"), appTarget, {
      recursive: true,
      errorOnExist: true,
    });
    for (const moduleName of input.modules) {
      const moduleTemplate = path.join(templateRoot, "modules", moduleName);
      if (await exists(moduleTemplate))
        await cp(moduleTemplate, appTarget, { recursive: true, force: false });
    }
    for (const packageName of packages) {
      await cp(
        path.join(repositoryRoot, "packages", packageName),
        path.join(target, "packages", packageName),
        {
          recursive: true,
          filter: copyFilter,
        },
      );
    }
    await cp(
      path.join(repositoryRoot, "tsconfig.base.json"),
      path.join(target, "tsconfig.base.json"),
    );
    await cp(
      path.join(repositoryRoot, "turbo.json"),
      path.join(target, "turbo.json"),
    );

    const modules = new Set(input.modules);
    await replaceTokens(appTarget, {
      __PRODUCT_NAME__: input.name,
      __PRODUCT_SLUG__: input.slug,
      __PRODUCT_DESCRIPTION__: input.description,
      __AUTH_ENABLED__: String(modules.has("auth")),
      __BILLING_ENABLED__: String(modules.has("billing")),
      __EMAIL_ENABLED__: String(modules.has("email")),
      __ANALYTICS_ENABLED__: String(modules.has("analytics")),
      __TRANSPILE_PACKAGES__: packages
        .map((name) => `"@saasforge/${name}"`)
        .join(", "),
      __FACTORY_VERSION__: factoryVersion,
    });
    await updatePackageManifest(appTarget, input.modules);
    await appendModuleEnvironment(appTarget, input.modules);
    await writeRepositoryFiles(
      target,
      input,
      factoryVersion,
      packages,
      generatedAt,
    );
    await formatGeneratedFiles(target);

    const manifest = JSON.parse(
      await readFile(path.join(target, "saasforge.manifest.json"), "utf8"),
    ) as GenerationManifest;
    await updateRegistry(repositoryRoot, {
      ...input,
      createdAt: generatedAt,
      status: "generated",
      mode: "standalone",
      relativePath: path.relative(repositoryRoot, target).replaceAll("\\", "/"),
    });
    return { target, input, manifest };
  } catch (error) {
    await rm(target, { recursive: true, force: true });
    throw error;
  }
}
