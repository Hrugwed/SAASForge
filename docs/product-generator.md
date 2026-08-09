# Product generator

## Create a product

Run the generator from the repository root:

```bash
pnpm forge:create -- --name "SignalDesk" --slug "signaldesk" --description "Turn scattered customer feedback into clear, prioritized product decisions." --modules "auth,billing,email,analytics"
```

Supported modules are `auth`, `billing`, `email`, and `analytics`. Billing requires authentication. The generator validates all input, prevents directory traversal and accidental replacement, composes the selected templates, and removes partial output if generation fails.

## What the product owns

Every generated product owns its brand, pages, core customer workflow, pricing, legal copy, domain, database, authentication secret, Stripe configuration, email sending domain, analytics project, deployment, backups, and incident response. Reusing factory packages does not mean products share production credentials or data.

For local development, copy the generated `.env.example` to `.env.local`, create a separate PostgreSQL database, give the product a unique local port, and apply the shared Prisma migrations to that database. Environment files are ignored and must never be committed.

## Design freedom

The base template supplies accessible structure, metadata, legal/blog routes, health checks, and quality tooling. It is not a visual clone of the factory. Replace the product's page composition and CSS with a design appropriate to its audience while keeping the stable capability contracts.

## Verification checklist

Before considering a generated product ready for feature work:

1. Configure an isolated local database and authentication secret.
2. Run `pnpm install`, database migrations, lint, type checking, unit tests, and a production build.
3. Run the Playwright journey and verify signup, protected access, workspace creation, and sign-out.
4. If billing is selected, configure a Stripe sandbox Price and webhook and test success, cancellation, and failed-payment states.
5. Replace placeholder legal copy and support email before any public launch.

SignalDesk under `products/signaldesk` is the factory's executable proof product. It may be deleted or replaced later; the reusable source of truth remains the generator, templates, and shared packages.
