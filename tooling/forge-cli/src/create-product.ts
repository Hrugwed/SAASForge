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
import { createHash } from "node:crypto";
import { format } from "prettier";
import { z } from "zod";

export const supportedModules = [
  "auth",
  "billing",
  "email",
  "analytics",
  "jobs",
  "storage",
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
  });

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

type ProductRegistryEntry = CreateProductInput & {
  createdAt: string;
  status: "generated";
  mode: "standalone";
  relativePath: string;
};

type GenerationManifest = {
  schemaVersion: 2;
  factory: { name: "SaaSForge"; version: string; templateVersion: 2 };
  product: CreateProductInput;
  outputMode: "standalone";
  generatedAt: string;
  ownership: {
    application: "apps/web";
    database: "packages/database/prisma/schema.prisma" | null;
    environment: "apps/web/.env.local";
  };
  managedFiles: Record<string, string>;
};

const packageDependencies = {
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
      ![
        ".ts",
        ".tsx",
        ".mjs",
        ".json",
        ".md",
        ".css",
        ".example",
        ".yaml",
        ".yml",
      ].includes(extension)
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
      ![
        ".ts",
        ".tsx",
        ".mjs",
        ".json",
        ".md",
        ".css",
        ".yaml",
        ".yml",
      ].includes(path.extname(entry.name))
    )
      continue;
    const source = await readFile(target, "utf8");
    await writeFile(target, await format(source, { filepath: target }), "utf8");
  }
}

async function fingerprintManagedFiles(
  directory: string,
  root = directory,
): Promise<Record<string, string>> {
  const fingerprints: Record<string, string> = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", ".next", ".turbo", "node_modules"].includes(entry.name))
      continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      Object.assign(fingerprints, await fingerprintManagedFiles(target, root));
      continue;
    }
    const relative = path.relative(root, target).replaceAll("\\", "/");
    if (
      relative === "saasforge.manifest.json" ||
      relative === "pnpm-lock.yaml" ||
      relative.endsWith(".env.local")
    )
      continue;
    const content = await readFile(target);
    fingerprints[relative] = createHash("sha256").update(content).digest("hex");
  }
  return Object.fromEntries(
    Object.entries(fingerprints).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

function selectedPackages(
  modules: CreateProductInput["modules"],
): FactoryPackage[] {
  const selected = new Set<FactoryPackage>(["config", "observability", "ui"]);
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
    manifest.dependencies["@saasforge/email"] = "workspace:*";
    manifest.dependencies["better-auth"] = "^1.6.26";
    manifest.dependencies["server-only"] = "0.0.1";
  }
  if (modules.includes("billing"))
    manifest.dependencies["@saasforge/billing"] = "workspace:*";
  if (modules.includes("email"))
    manifest.dependencies["@saasforge/email"] = "workspace:*";
  if (modules.includes("analytics"))
    manifest.dependencies["@saasforge/analytics"] = "workspace:*";
  if (modules.includes("jobs")) {
    manifest.dependencies["@saasforge/jobs"] = "workspace:*";
    manifest.dependencies["inngest"] = "^4.18.0";
  }
  if (modules.includes("storage"))
    manifest.dependencies["@saasforge/storage"] = "workspace:*";
  if (
    modules.includes("email") ||
    modules.includes("analytics") ||
    modules.includes("jobs") ||
    modules.includes("storage")
  ) {
    manifest.dependencies["server-only"] = "0.0.1";
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
CRON_SECRET=replace-with-at-least-32-random-characters
`);
  }
  if (modules.includes("auth") || modules.includes("email")) {
    sections.push(`
# Resend transactional and identity email; verify the sending domain before launch
RESEND_API_KEY=
EMAIL_FROM=Product Name <hello@example.com>
`);
  }
  if (modules.includes("analytics")) {
    sections.push(`
# PostHog server analytics; select the correct regional host
POSTHOG_API_KEY=
POSTHOG_HOST=https://us.i.posthog.com
`);
  }
  if (modules.includes("jobs")) {
    sections.push(`
# Inngest durable jobs; INNGEST_DEV uses the local development server
INNGEST_DEV=1
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
`);
  }
  if (modules.includes("storage")) {
    sections.push(`
# Cloudflare R2 private object storage
CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
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

async function writeReadinessRoute(
  appTarget: string,
  modules: CreateProductInput["modules"],
): Promise<void> {
  const requiredEnvironment = ["NEXT_PUBLIC_APP_URL", "APP_ENV", "SENTRY_DSN"];
  if (modules.includes("auth")) {
    requiredEnvironment.push(
      "DATABASE_URL",
      "BETTER_AUTH_SECRET",
      "BETTER_AUTH_URL",
    );
  }
  if (modules.includes("billing")) {
    requiredEnvironment.push(
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_PRICE_DEFAULT",
      "CRON_SECRET",
    );
  }
  if (modules.includes("email")) {
    requiredEnvironment.push("RESEND_API_KEY", "EMAIL_FROM");
  }
  if (modules.includes("analytics")) {
    requiredEnvironment.push("POSTHOG_API_KEY", "POSTHOG_HOST");
  }
  if (modules.includes("jobs")) {
    requiredEnvironment.push("INNGEST_EVENT_KEY", "INNGEST_SIGNING_KEY");
  }
  if (modules.includes("storage")) {
    requiredEnvironment.push(
      "CLOUDFLARE_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET",
    );
  }

  const databaseCheck = modules.includes("auth")
    ? `
  if (missingEnvironment.length === 0) {
    try {
      const { database } = await import("@saasforge/database");
      await database.$queryRaw\`SELECT 1\`;
      checks.database = "ready";
    } catch {
      checks.database = "unavailable";
    }
  } else {
    checks.database = "not-configured";
  }
`
    : "";
  const source = `import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const requiredEnvironment = ${JSON.stringify(requiredEnvironment)} as const;

export async function GET() {
  const missingEnvironment = requiredEnvironment.filter(
    (name) => !process.env[name]?.trim(),
  );
  const checks: Record<string, string> = {
    configuration: missingEnvironment.length === 0 ? "ready" : "unavailable",
  };
${databaseCheck}
  const healthy = Object.values(checks).every((status) => status === "ready");
  return NextResponse.json(
    {
      status: healthy ? "ready" : "unavailable",
      checks,
      missingEnvironment,
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
`;
  const route = path.join(appTarget, "src", "app", "api", "ready", "route.ts");
  await mkdir(path.dirname(route), { recursive: true });
  await writeFile(route, source, "utf8");
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
    engines: { node: ">=22.14.0 <23" },
    scripts: {
      build: "turbo run build",
      dev: "turbo run dev",
      "product:doctor": "node scripts/doctor.mjs",
      "product:changes": "node scripts/managed-files.mjs",
      "product:setup": "node scripts/setup.mjs",
      lint: "turbo run lint",
      typecheck: "turbo run typecheck",
      test: "turbo run test",
      "test:e2e": "turbo run test:e2e",
      format: "prettier --write .",
      "format:check": "prettier --check .",
      "license:check": "node tooling/security/license-check.mjs",
      ...(hasDatabase
        ? {
            postinstall: "pnpm db:generate",
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
      vercel: "58.11.0",
    },
    pnpm: {
      onlyBuiltDependencies: [
        "@prisma/engines",
        "@sentry/cli",
        "esbuild",
        "prisma",
        "protobufjs",
        "sharp",
        "unrs-resolver",
      ],
    },
  };
  const manifest: GenerationManifest = {
    schemaVersion: 2,
    factory: { name: "SaaSForge", version: factoryVersion, templateVersion: 2 },
    product: input,
    outputMode: "standalone",
    generatedAt,
    ownership: {
      application: "apps/web",
      database: hasDatabase ? "packages/database/prisma/schema.prisma" : null,
      environment: "apps/web/.env.local",
    },
    managedFiles: {},
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
  await writeFile(path.join(target, ".nvmrc"), "22.14.0\n");
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

async function updateDeploymentConfiguration(
  target: string,
  modules: CreateProductInput["modules"],
): Promise<void> {
  const configurationPath = path.join(target, "vercel.json");
  const configuration = JSON.parse(
    await readFile(configurationPath, "utf8"),
  ) as Record<string, unknown>;
  if (modules.includes("billing")) {
    configuration.crons = [
      {
        path: "/api/internal/billing/reconcile",
        schedule: "17 3 * * *",
      },
    ];
  }
  await writeFile(
    configurationPath,
    `${JSON.stringify(configuration, null, 2)}\n`,
    "utf8",
  );
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
    const repositoryTemplate = path.join(templateRoot, "repository");
    if (await exists(repositoryTemplate)) {
      await cp(repositoryTemplate, target, {
        recursive: true,
        errorOnExist: true,
      });
    }
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
    await mkdir(path.join(target, "tooling", "security"), { recursive: true });
    await cp(
      path.join(repositoryRoot, "tooling", "security", "license-check.mjs"),
      path.join(target, "tooling", "security", "license-check.mjs"),
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
      __JOBS_ENABLED__: String(modules.has("jobs")),
      __STORAGE_ENABLED__: String(modules.has("storage")),
      __TRANSPILE_PACKAGES__: packages
        .map((name) => `"@saasforge/${name}"`)
        .join(", "),
      __FACTORY_VERSION__: factoryVersion,
      "{{PRODUCT_NAME}}": input.name,
      "{{PRODUCT_DESCRIPTION}}": input.description,
      "{{FACTORY_VERSION}}": factoryVersion,
      "{{AUTH_ENABLED}}": String(modules.has("auth")),
      "{{BILLING_ENABLED}}": String(modules.has("billing")),
      "{{EMAIL_ENABLED}}": String(modules.has("email")),
      "{{ANALYTICS_ENABLED}}": String(modules.has("analytics")),
      "{{JOBS_ENABLED}}": String(modules.has("jobs")),
      "{{STORAGE_ENABLED}}": String(modules.has("storage")),
    });
    await updatePackageManifest(appTarget, input.modules);
    await appendModuleEnvironment(appTarget, input.modules);
    await writeReadinessRoute(appTarget, input.modules);
    await writeRepositoryFiles(
      target,
      input,
      factoryVersion,
      packages,
      generatedAt,
    );
    await updateDeploymentConfiguration(target, input.modules);
    await replaceTokens(target, {
      __PRODUCT_NAME__: input.name,
      __PRODUCT_SLUG__: input.slug,
      __PRODUCT_DESCRIPTION__: input.description,
      "      # __DATABASE_QUALITY_STEPS__": packages.includes("database")
        ? "      - run: pnpm db:validate\n      - run: pnpm db:generate\n      - run: pnpm db:deploy"
        : "",
      "      # __DATABASE_DEPLOY_STEP__": packages.includes("database")
        ? "      - run: pnpm db:deploy"
        : "",
    });
    await formatGeneratedFiles(target);

    const generatedManifest = JSON.parse(
      await readFile(path.join(target, "saasforge.manifest.json"), "utf8"),
    ) as GenerationManifest;
    generatedManifest.managedFiles = await fingerprintManagedFiles(target);
    await writeFile(
      path.join(target, "saasforge.manifest.json"),
      await format(`${JSON.stringify(generatedManifest, null, 2)}\n`, {
        filepath: path.join(target, "saasforge.manifest.json"),
      }),
      "utf8",
    );

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
