# SaaSForge

SaaSForge is an AI-native, production-oriented foundation for repeatedly launching independent SaaS products without rebuilding authentication, billing, email, analytics, design, and operations each time.

## Status

SaaSForge's reusable engineering foundation is implemented and validated locally. A generated product is not automatically production-ready: its provider accounts, legal decisions, domain verification, restore drill, alerts, product-specific tests, and launch review remain the product owner's responsibility. Track those gates in `docs/production-readiness.md`.

## Structure

```text
apps/
  factory/          Private SaaSForge control center
packages/
  analytics/        Validated, provider-neutral product events
  auth/             Better Auth configuration and authorization policy
  billing/          Stripe adapter, webhook processing, and entitlements
  config/           Validated product configuration
  database/         Prisma schema, migrations, and PostgreSQL client
  email/            Validated transactional delivery boundary and templates
  jobs/             Durable tenant event contract and Inngest adapter
  observability/    Redacted structured logging shared by every product
  storage/          Private tenant object contract and Cloudflare R2 adapter
  ui/               Shared design system
products/           Ignored, standalone generated repositories
templates/
  saas-product/     Base product and selectable module overlays
tooling/
  forge-cli/        Validated, rollback-safe product generator
docs/
  architecture.md   Architecture decisions and boundaries
  control-plane.md  Private product inventory and operator safety model
  billing.md        Stripe sandbox, webhook, and production setup
  database-auth.md  Local and production identity/data setup
  deployment.md     Generated-repository release and operations model
  email.md          Transactional delivery and observability decisions
  jobs.md           Durable background-work patterns
  storage.md        Private tenant object-storage controls
  product-generator.md Product creation and isolation playbook
  roadmap.md        Phased implementation plan
  validation/       Reproducible factory release evidence
```

## Commands

```bash
npm run factory:bootstrap
```

The bootstrap command installs the pinned dependencies, creates safe local configuration, generates Prisma, starts or checks PostgreSQL, deploys migrations, starts the loopback-only factory, and verifies `http://127.0.0.1:3000/api/health`. It uses Docker Compose when available and otherwise falls back to Prisma's local development database. Press `Ctrl+C` to stop the attached factory server.

The equivalent granular commands are:

```bash
pnpm install
pnpm factory:setup
pnpm factory:doctor
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm forge:create -- --name "My Product" --slug "my-product" --description "A clear customer outcome described here." --modules "auth,billing,email,analytics,jobs,storage"
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm license:check
pnpm build
pnpm test:e2e
```

`factory:setup` creates only an ignored local environment and never overwrites an existing one. `factory:doctor` validates prerequisites, configuration, generated Prisma artifacts, database connectivity, migration status, and factory port ownership without printing secret values. Generated repositories provide their own `pnpm product:setup` and `pnpm product:doctor` commands.

The factory contains a real control plane that reconciles generated products with their manifests, plus the design system, validated configuration, PostgreSQL/Prisma data layer, Better Auth identity, organization tenancy, reusable Stripe billing engine, email and analytics boundaries, structured logs, Sentry wiring, security headers, health/readiness endpoints, and automated quality pipeline. Customer-facing pricing, design, provider credentials, database, domain, and deployment belong to each generated product.

## Security and contribution

Read `SECURITY.md` before reporting a vulnerability and `CONTRIBUTING.md` before proposing a broad capability. This repository is MIT licensed. Generated products remain private and unlicensed by default so each product owner makes an explicit licensing decision.

## Principles

1. Secure defaults over optional hardening.
2. A modular monolith over premature distributed systems.
3. Provider adapters over provider payloads in product code.
4. Independent product data and secrets over shared production blast radius.
5. Automated verification over undocumented confidence.
