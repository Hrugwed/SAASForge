# Product generator

## Create a product

Run the generator from the repository root:

```bash
pnpm forge:create -- --name "My Product" --slug "my-product" --description "A clear customer outcome." --modules "auth,billing,email,analytics,jobs,storage"
```

The private factory dashboard can compose the same input contract without executing the generator. It exports a versioned JSON document with `outputMode: "standalone"` and a copy-only command using `--blueprint <base64url>`. The encoded payload contains only shell-safe base64url characters; the CLI decodes it, validates the strict document schema, and rejects commands that mix a blueprint with explicit product options. Explicit flags remain supported for direct terminal use.

Supported modules are `auth`, `billing`, `email`, `analytics`, `jobs`, and `storage`. Billing, jobs, and storage require authentication so tenant ownership is established. The generator validates all input, resolves package dependency closure, prevents directory traversal and accidental replacement, composes the selected templates, and removes partial output if generation fails. Successful concurrent generations serialize their registry transaction with an exclusive bounded lock so one product cannot silently erase another registry entry.

The output under `products/<slug>` is a self-contained repository, not a package in the factory workspace. It contains `apps/web`, only the selected reusable capability packages and their dependency closure, root quality tooling, safe `setup`, `doctor`, and managed-file inspection commands, its own database schema and migrations when data capabilities are enabled, product-specific GitHub quality/security/release workflows, Vercel configuration, upgrade and operations runbooks, agent instructions, and `saasforge.manifest.json`. Move that directory to its own Git repository when product work begins.

## Verify reference profiles

The factory continuously composes two disposable standalone profiles: `lean` selects analytics only, while `full` selects all six modules. Generate one outside the factory checkout with:

```bash
pnpm --filter @saasforge/forge-cli reference:create -- --profile lean --output "C:/temp/saasforge-reference-lean"
```

The command refuses in-factory output, does not update the factory product registry, and verifies the generated manifest, database ownership, workspace isolation, and absence of linked paths. The reference-product CI workflow then performs independent installation, setup, diagnostics, quality checks, production build, and local-adapter browser journeys. These checks do not constitute real provider sandbox or product launch evidence.

Before a production deployment, copy `docs/launch-evidence.example.json` to `docs/launch-evidence.json` and follow the POSIX or PowerShell launch-check command in the generated deployment guide. The validator requires immutable `--commit` and `--version` arguments and rejects mismatched, stale, or placeholder quality, security, accessibility, performance, restore, rollback, or alert-routing records. The protected production workflow passes the workflow commit and package version to the same check before migrations or deployment.

## What the product owns

Every generated product owns its brand, pages, core customer workflow, pricing, legal copy, domain, database, authentication secret, Stripe configuration, email sending domain, analytics project, deployment, backups, and incident response. Reusing factory packages does not mean products share production credentials or data.

For local development, copy `apps/web/.env.example` to `apps/web/.env.local`, create a separate PostgreSQL database, give the product a unique local port, and apply the generated repository's migrations to that database. Environment files are ignored and must never be committed.

## Design freedom

The base template supplies accessible structure, metadata, legal/blog routes, health checks, and quality tooling. It is not a visual clone of the factory. Replace the product's page composition and CSS with a design appropriate to its audience while keeping the stable capability contracts.

## Verification checklist

Before considering a generated product ready for feature work:

1. Configure an isolated local database and authentication secret.
2. Change into the generated repository and run `pnpm install`, `pnpm product:setup`, `pnpm product:doctor`, database migrations, lint, type checking, unit tests, and a production build.
3. Run the Playwright journey and verify signup, protected access, workspace creation, and sign-out.
4. If billing is selected, configure a Stripe sandbox Price and webhook and test success, cancellation, and failed-payment states.
5. Replace placeholder legal copy and support email before any public launch.
6. Follow `docs/deployment.md`, protect the GitHub `production` environment, and exercise the rollback and restore runbooks.
7. When jobs are enabled, replace the example task body, configure a product-owned Inngest app, and exercise success, retry, terminal failure, replay, and backlog alerts.

Generated validation products are disposable. The reusable source of truth is the generator, templates, capability contracts, tests, and documentation. Product-specific database models must never be added to the factory's shared schema.

## Upgrade a generated product

From the target factory checkout, inspect a standalone product without changing it:

```bash
pnpm forge:upgrade -- --product "C:/path/to/my-product"
```

The command regenerates the product's recorded blueprint in a temporary directory and makes a three-way comparison with its stored fingerprints. Add `--apply` only after reviewing the plan. It refuses invalid manifests, products inside the factory checkout, unsafe managed paths, and conflicting edits. It never installs dependencies, applies migrations, or changes unmanaged files, lockfiles, or local environment files.
