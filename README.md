# SaaSForge

SaaSForge is a private, secure foundation for repeatedly launching SaaS products without rebuilding authentication, billing, email, analytics, design, and operations each time. It is our internal factory, not a product for sale.

## Status

Factory v1 is operational. It has a private control center, a safe product generator, reusable capability packages, selectable product modules, and an independently generated proof product called SignalDesk.

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
  ui/               Shared design system
products/
  signaldesk/       Generated verification product with an independent design
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
docker compose up -d
pnpm db:migrate
pnpm forge:create -- --name "My Product" --slug "my-product" --description "A clear customer outcome described here." --modules "auth,billing,email,analytics"
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

The factory contains the private application shell, design system, validated configuration, PostgreSQL/Prisma data layer, Better Auth identity, organization tenancy, reusable Stripe billing engine, email and analytics boundaries, security headers, health endpoints, and automated quality pipeline. Customer-facing Checkout, pricing, design, provider credentials, database, domain, and deployment belong to each generated product.

## Principles

1. Secure defaults over optional hardening.
2. A modular monolith over premature distributed systems.
3. Provider adapters over provider payloads in product code.
4. Independent product data and secrets over shared production blast radius.
5. Automated verification over undocumented confidence.
