# SaaSForge

SaaSForge is an AI-native, production-oriented foundation for repeatedly launching independent SaaS products without rebuilding authentication, billing, email, analytics, design, and operations each time.

## Status

SaaSForge is under active hardening. The existing foundation is usable for development, but the public, production-ready factory exit criteria in `docs/production-readiness.md` are not yet complete.

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
  billing.md        Stripe sandbox, webhook, and production setup
  database-auth.md  Local and production identity/data setup
  product-generator.md Product creation and isolation playbook
  roadmap.md        Phased implementation plan
```

## Commands

```bash
pnpm install
pnpm factory:setup
pnpm factory:doctor
docker compose up -d
pnpm db:migrate
pnpm forge:create -- --name "My Product" --slug "my-product" --description "A clear customer outcome described here." --modules "auth,billing,email,analytics,jobs,storage"
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

`factory:setup` creates only an ignored local environment and never overwrites an existing one. `factory:doctor` validates prerequisites and configuration without printing secret values. Generated repositories provide their own `pnpm product:setup` and `pnpm product:doctor` commands.

The factory contains the control center, design system, validated configuration, PostgreSQL/Prisma data layer, Better Auth identity, organization tenancy, reusable Stripe billing engine, email and analytics boundaries, structured logs, Sentry wiring, security headers, health/readiness endpoints, and automated quality pipeline. Customer-facing pricing, design, provider credentials, database, domain, and deployment belong to each generated product.

## Principles

1. Secure defaults over optional hardening.
2. A modular monolith over premature distributed systems.
3. Provider adapters over provider payloads in product code.
4. Independent product data and secrets over shared production blast radius.
5. Automated verification over undocumented confidence.
