# Product generator

## Create a product

Run the generator from the repository root:

```bash
pnpm forge:create -- --name "My Product" --slug "my-product" --description "A clear customer outcome." --modules "auth,billing,email,analytics"
```

Supported modules are `auth`, `billing`, `email`, and `analytics`. Billing requires authentication. The generator validates all input, prevents directory traversal and accidental replacement, composes the selected templates, and removes partial output if generation fails.

The output under `products/<slug>` is a self-contained repository, not a package in the factory workspace. It contains `apps/web`, only the selected reusable capability packages and their dependency closure, root quality tooling, its own database schema and migrations when data capabilities are enabled, agent instructions, and `saasforge.manifest.json`. Move that directory to its own Git repository when product work begins.

## What the product owns

Every generated product owns its brand, pages, core customer workflow, pricing, legal copy, domain, database, authentication secret, Stripe configuration, email sending domain, analytics project, deployment, backups, and incident response. Reusing factory packages does not mean products share production credentials or data.

For local development, copy `apps/web/.env.example` to `apps/web/.env.local`, create a separate PostgreSQL database, give the product a unique local port, and apply the generated repository's migrations to that database. Environment files are ignored and must never be committed.

## Design freedom

The base template supplies accessible structure, metadata, legal/blog routes, health checks, and quality tooling. It is not a visual clone of the factory. Replace the product's page composition and CSS with a design appropriate to its audience while keeping the stable capability contracts.

## Verification checklist

Before considering a generated product ready for feature work:

1. Configure an isolated local database and authentication secret.
2. Change into the generated repository and run `pnpm install`, database migrations, lint, type checking, unit tests, and a production build.
3. Run the Playwright journey and verify signup, protected access, workspace creation, and sign-out.
4. If billing is selected, configure a Stripe sandbox Price and webhook and test success, cancellation, and failed-payment states.
5. Replace placeholder legal copy and support email before any public launch.

Generated validation products are disposable. The reusable source of truth is the generator, templates, capability contracts, tests, and documentation. Product-specific database models must never be added to the factory's shared schema.
